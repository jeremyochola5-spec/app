from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
import uuid
import secrets
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

from fastapi import FastAPI, APIRouter, Request, Response, HTTPException, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ---------------- MongoDB Connection ----------------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]


# ---------------- App / Router ----------------
app = FastAPI(title="Jersave API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ---------------- JWT Helpers ----------------
JWT_ALGORITHM = "HS256"

def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=60 * 24), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    response.set_cookie("access_token", access_token, httponly=True, secure=True, samesite="none", max_age=60 * 60 * 24, path="/")
    response.set_cookie("refresh_token", refresh_token, httponly=True, secure=True, samesite="none", max_age=60 * 60 * 24 * 7, path="/")


# ---------------- Password Helpers ----------------
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


# ---------------- Models ----------------
class UserPublic(BaseModel):
    id: str
    email: EmailStr
    name: str
    phone: Optional[str] = None
    role: str = "user"
    savings_balance: float = 0.0
    created_at: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1)
    phone: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AmountRequest(BaseModel):
    amount: float = Field(gt=0)
    phone: Optional[str] = None  # for mock mpesa flows


class SaccoCreate(BaseModel):
    name: str = Field(min_length=2)
    description: Optional[str] = ""
    goal_amount: Optional[float] = 0.0


class SaccoJoinRequest(BaseModel):
    sacco_id: str


class SaccoContribute(BaseModel):
    sacco_id: str
    amount: float = Field(gt=0)


# ---------------- Helpers ----------------
def user_to_public(user: dict) -> dict:
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "phone": user.get("phone"),
        "role": user.get("role", "user"),
        "savings_balance": float(user.get("savings_balance", 0.0)),
        "created_at": user.get("created_at"),
    }


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# ---------------- Brute Force Helpers ----------------
async def check_brute_force(identifier: str):
    now = datetime.now(timezone.utc)
    record = await db.login_attempts.find_one({"identifier": identifier})
    if record and record.get("count", 0) >= 5:
        locked_until = record.get("locked_until")
        if locked_until and datetime.fromisoformat(locked_until) > now:
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")

async def record_failed_attempt(identifier: str):
    now = datetime.now(timezone.utc)
    locked_until = (now + timedelta(minutes=15)).isoformat()
    await db.login_attempts.update_one(
        {"identifier": identifier},
        {"$inc": {"count": 1}, "$set": {"locked_until": locked_until, "last_attempt": now.isoformat()}},
        upsert=True,
    )

async def clear_attempts(identifier: str):
    await db.login_attempts.delete_one({"identifier": identifier})


# ---------------- Auth Endpoints ----------------
@api_router.post("/auth/register")
async def register(req: RegisterRequest, response: Response):
    email = req.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": email,
        "name": req.name.strip(),
        "phone": req.phone,
        "password_hash": hash_password(req.password),
        "role": "user",
        "savings_balance": 0.0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user_doc)
    access = create_access_token(user_id, email)
    refresh = create_refresh_token(user_id)
    set_auth_cookies(response, access, refresh)
    return {"user": user_to_public(user_doc), "access_token": access}


@api_router.post("/auth/login")
async def login(req: LoginRequest, request: Request, response: Response):
    email = req.email.lower().strip()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    await check_brute_force(identifier)
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user or not verify_password(req.password, user["password_hash"]):
        await record_failed_attempt(identifier)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await clear_attempts(identifier)
    access = create_access_token(user["id"], email)
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    return {"user": user_to_public(user), "access_token": access}


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return {"user": user_to_public(user)}


# ---------------- Savings Endpoints ----------------
@api_router.get("/savings/balance")
async def get_balance(user: dict = Depends(get_current_user)):
    return {"balance": float(user.get("savings_balance", 0.0))}


@api_router.post("/savings/deposit")
async def deposit(req: AmountRequest, user: dict = Depends(get_current_user)):
    """Simulated M-Pesa deposit into Jersave personal savings."""
    new_balance = float(user.get("savings_balance", 0.0)) + req.amount
    await db.users.update_one({"id": user["id"]}, {"$set": {"savings_balance": new_balance}})
    tx = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "type": "deposit",
        "amount": req.amount,
        "phone": req.phone,
        "sacco_id": None,
        "description": "M-Pesa deposit to Jersave savings (simulated)",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.transactions.insert_one(tx)
    tx.pop("_id", None)
    return {"transaction": tx, "balance": new_balance}


@api_router.post("/savings/withdraw")
async def withdraw(req: AmountRequest, user: dict = Depends(get_current_user)):
    current = float(user.get("savings_balance", 0.0))
    if req.amount > current:
        raise HTTPException(status_code=400, detail="Insufficient savings balance")
    new_balance = current - req.amount
    await db.users.update_one({"id": user["id"]}, {"$set": {"savings_balance": new_balance}})
    tx = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "type": "withdraw",
        "amount": req.amount,
        "phone": req.phone,
        "sacco_id": None,
        "description": "Withdraw to M-Pesa from Jersave savings (simulated)",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.transactions.insert_one(tx)
    tx.pop("_id", None)
    return {"transaction": tx, "balance": new_balance}


@api_router.get("/transactions")
async def list_transactions(user: dict = Depends(get_current_user), limit: int = 50):
    cur = db.transactions.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).limit(limit)
    items = await cur.to_list(limit)
    return {"items": items}


# ---------------- Sacco Endpoints ----------------
async def compute_sacco_view(sacco: dict) -> dict:
    members = sacco.get("members", [])
    total = sum(float(m.get("contribution", 0.0)) for m in members)
    enriched_members = []
    for m in members:
        u = await db.users.find_one({"id": m["user_id"]}, {"_id": 0, "name": 1, "email": 1})
        pct = (float(m["contribution"]) / total * 100.0) if total > 0 else 0.0
        enriched_members.append({
            "user_id": m["user_id"],
            "name": u["name"] if u else "Unknown",
            "email": u["email"] if u else "",
            "contribution": float(m.get("contribution", 0.0)),
            "percentage": round(pct, 2),
            "joined_at": m.get("joined_at"),
        })
    return {
        "id": sacco["id"],
        "name": sacco["name"],
        "description": sacco.get("description", ""),
        "goal_amount": float(sacco.get("goal_amount", 0.0)),
        "created_by": sacco.get("created_by"),
        "created_at": sacco.get("created_at"),
        "total_balance": round(total, 2),
        "member_count": len(members),
        "members": enriched_members,
    }


@api_router.get("/saccos")
async def list_saccos(user: dict = Depends(get_current_user)):
    cur = db.saccos.find({}, {"_id": 0})
    saccos = await cur.to_list(500)
    result = []
    for s in saccos:
        view = await compute_sacco_view(s)
        is_member = any(m["user_id"] == user["id"] for m in s.get("members", []))
        view["is_member"] = is_member
        result.append(view)
    return {"items": result}


@api_router.get("/saccos/mine")
async def my_saccos(user: dict = Depends(get_current_user)):
    cur = db.saccos.find({"members.user_id": user["id"]}, {"_id": 0})
    saccos = await cur.to_list(500)
    result = []
    for s in saccos:
        view = await compute_sacco_view(s)
        my_member = next((m for m in view["members"] if m["user_id"] == user["id"]), None)
        view["my_contribution"] = my_member["contribution"] if my_member else 0.0
        view["my_percentage"] = my_member["percentage"] if my_member else 0.0
        result.append(view)
    return {"items": result}


@api_router.post("/saccos")
async def create_sacco(req: SaccoCreate, user: dict = Depends(get_current_user)):
    sacco_doc = {
        "id": str(uuid.uuid4()),
        "name": req.name.strip(),
        "description": req.description or "",
        "goal_amount": float(req.goal_amount or 0.0),
        "created_by": user["id"],
        "members": [{
            "user_id": user["id"],
            "contribution": 0.0,
            "joined_at": datetime.now(timezone.utc).isoformat(),
        }],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.saccos.insert_one(sacco_doc)
    sacco_doc.pop("_id", None)
    return await compute_sacco_view(sacco_doc)


@api_router.get("/saccos/{sacco_id}")
async def get_sacco(sacco_id: str, user: dict = Depends(get_current_user)):
    sacco = await db.saccos.find_one({"id": sacco_id}, {"_id": 0})
    if not sacco:
        raise HTTPException(status_code=404, detail="Sacco not found")
    view = await compute_sacco_view(sacco)
    view["is_member"] = any(m["user_id"] == user["id"] for m in sacco.get("members", []))
    return view


@api_router.post("/saccos/{sacco_id}/join")
async def join_sacco(sacco_id: str, user: dict = Depends(get_current_user)):
    sacco = await db.saccos.find_one({"id": sacco_id})
    if not sacco:
        raise HTTPException(status_code=404, detail="Sacco not found")
    if any(m["user_id"] == user["id"] for m in sacco.get("members", [])):
        raise HTTPException(status_code=400, detail="Already a member")
    new_member = {
        "user_id": user["id"],
        "contribution": 0.0,
        "joined_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.saccos.update_one({"id": sacco_id}, {"$push": {"members": new_member}})
    updated = await db.saccos.find_one({"id": sacco_id}, {"_id": 0})
    return await compute_sacco_view(updated)


@api_router.post("/saccos/{sacco_id}/contribute")
async def contribute_to_sacco(sacco_id: str, req: AmountRequest, user: dict = Depends(get_current_user)):
    sacco = await db.saccos.find_one({"id": sacco_id})
    if not sacco:
        raise HTTPException(status_code=404, detail="Sacco not found")
    if not any(m["user_id"] == user["id"] for m in sacco.get("members", [])):
        raise HTTPException(status_code=403, detail="Join the sacco first")
    await db.saccos.update_one(
        {"id": sacco_id, "members.user_id": user["id"]},
        {"$inc": {"members.$.contribution": req.amount}},
    )
    tx = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "type": "sacco_deposit",
        "amount": req.amount,
        "phone": req.phone,
        "sacco_id": sacco_id,
        "description": f"M-Pesa contribution to sacco (simulated)",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.transactions.insert_one(tx)
    updated = await db.saccos.find_one({"id": sacco_id}, {"_id": 0})
    return await compute_sacco_view(updated)


@api_router.post("/saccos/{sacco_id}/withdraw")
async def withdraw_from_sacco(sacco_id: str, req: AmountRequest, user: dict = Depends(get_current_user)):
    sacco = await db.saccos.find_one({"id": sacco_id})
    if not sacco:
        raise HTTPException(status_code=404, detail="Sacco not found")
    member = next((m for m in sacco.get("members", []) if m["user_id"] == user["id"]), None)
    if not member:
        raise HTTPException(status_code=403, detail="Not a member")
    if req.amount > float(member.get("contribution", 0.0)):
        raise HTTPException(status_code=400, detail="Cannot withdraw more than your contribution")
    await db.saccos.update_one(
        {"id": sacco_id, "members.user_id": user["id"]},
        {"$inc": {"members.$.contribution": -req.amount}},
    )
    tx = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "type": "sacco_withdraw",
        "amount": req.amount,
        "phone": req.phone,
        "sacco_id": sacco_id,
        "description": f"Withdraw from sacco to M-Pesa (simulated)",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.transactions.insert_one(tx)
    updated = await db.saccos.find_one({"id": sacco_id}, {"_id": 0})
    return await compute_sacco_view(updated)


# ---------------- Admin Endpoints ----------------
@api_router.get("/admin/users")
async def admin_list_users(_: dict = Depends(require_admin)):
    cur = db.users.find({}, {"_id": 0, "password_hash": 0})
    users = await cur.to_list(1000)
    return {"items": users}


@api_router.get("/admin/transactions")
async def admin_list_transactions(_: dict = Depends(require_admin), limit: int = 200):
    cur = db.transactions.find({}, {"_id": 0}).sort("created_at", -1).limit(limit)
    return {"items": await cur.to_list(limit)}


@api_router.get("/admin/saccos")
async def admin_list_saccos(_: dict = Depends(require_admin)):
    cur = db.saccos.find({}, {"_id": 0})
    saccos = await cur.to_list(500)
    result = [await compute_sacco_view(s) for s in saccos]
    return {"items": result}


@api_router.get("/admin/stats")
async def admin_stats(_: dict = Depends(require_admin)):
    total_users = await db.users.count_documents({})
    total_saccos = await db.saccos.count_documents({})
    pipeline = [{"$group": {"_id": None, "total": {"$sum": "$savings_balance"}}}]
    agg = await db.users.aggregate(pipeline).to_list(1)
    total_savings = float(agg[0]["total"]) if agg else 0.0
    saccos = await db.saccos.find({}, {"_id": 0, "members": 1}).to_list(500)
    total_sacco_balance = sum(sum(float(m.get("contribution", 0.0)) for m in s.get("members", [])) for s in saccos)
    total_tx = await db.transactions.count_documents({})
    return {
        "total_users": total_users,
        "total_saccos": total_saccos,
        "total_personal_savings": round(total_savings, 2),
        "total_sacco_savings": round(total_sacco_balance, 2),
        "total_transactions": total_tx,
    }


# ---------------- Misc ----------------
@api_router.get("/")
async def root():
    return {"message": "Jersave API running"}


# ---------------- Startup ----------------
@app.on_event("startup")
async def startup_event():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.saccos.create_index("id", unique=True)
    await db.transactions.create_index("user_id")
    await db.transactions.create_index("created_at")
    await db.login_attempts.create_index("identifier")
    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@jersave.com").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "name": "Jersave Admin",
            "phone": None,
            "password_hash": hash_password(admin_password),
            "role": "admin",
            "savings_balance": 0.0,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Seeded admin user {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password), "role": "admin"}})
        logger.info(f"Updated admin password for {admin_email}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


# ---------------- CORS ----------------
app.include_router(api_router)

cors_origins = [o.strip() for o in os.environ.get('CORS_ORIGINS', '').split(',') if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_origins or ["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)
