"""Jersave backend API tests - auth, savings, saccos, admin."""
import os
import time
import uuid
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://group-savings-app-3.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@jersave.com"
ADMIN_PASSWORD = "JersaveAdmin@2025"


def _session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def user_session():
    s = _session()
    email = f"TEST_user_{uuid.uuid4().hex[:8]}@jersave.com"
    r = s.post(f"{API}/auth/register", json={"email": email, "password": "TestUser@2025", "name": "Test User", "phone": "+254700000001"})
    assert r.status_code == 200, r.text
    s.email = email
    s.user = r.json()["user"]
    return s


@pytest.fixture(scope="module")
def admin_session():
    s = _session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return s


# ---------------- Health ----------------
def test_health():
    r = requests.get(f"{API}/")
    assert r.status_code == 200
    assert "message" in r.json()


# ---------------- Auth ----------------
def test_register_sets_cookies(user_session):
    # cookies should be set
    assert "access_token" in user_session.cookies
    assert "refresh_token" in user_session.cookies
    assert user_session.user["role"] == "user"
    assert user_session.user["savings_balance"] == 0.0


def test_register_duplicate_rejected(user_session):
    r = requests.post(f"{API}/auth/register", json={"email": user_session.email, "password": "TestUser@2025", "name": "Dup"})
    assert r.status_code == 400


def test_me_via_cookie(user_session):
    r = user_session.get(f"{API}/auth/me")
    assert r.status_code == 200
    assert r.json()["user"]["email"] == user_session.email


def test_login_admin(admin_session):
    r = admin_session.get(f"{API}/auth/me")
    assert r.status_code == 200
    assert r.json()["user"]["role"] == "admin"


def test_logout_clears_cookies():
    s = _session()
    email = f"TEST_logout_{uuid.uuid4().hex[:6]}@jersave.com"
    s.post(f"{API}/auth/register", json={"email": email, "password": "Password@123", "name": "L"})
    assert "access_token" in s.cookies
    r = s.post(f"{API}/auth/logout")
    assert r.status_code == 200
    # After logout, /auth/me should 401 with cleared cookies
    s.cookies.clear()
    r2 = s.get(f"{API}/auth/me")
    assert r2.status_code == 401


def test_brute_force_lockout():
    s = _session()
    bogus_email = f"TEST_brute_{uuid.uuid4().hex[:6]}@jersave.com"
    last = None
    for _ in range(6):
        last = s.post(f"{API}/auth/login", json={"email": bogus_email, "password": "wrongpass"})
    # 6th attempt should be 429 (lockout after 5 failures)
    assert last.status_code == 429, f"Expected 429, got {last.status_code}: {last.text}"


# ---------------- Savings ----------------
def test_savings_deposit_and_balance(user_session):
    r = user_session.post(f"{API}/savings/deposit", json={"amount": 500.0, "phone": "+254700"})
    assert r.status_code == 200
    data = r.json()
    assert data["balance"] == 500.0
    assert data["transaction"]["type"] == "deposit"
    b = user_session.get(f"{API}/savings/balance").json()
    assert b["balance"] == 500.0


def test_savings_withdraw_insufficient(user_session):
    r = user_session.post(f"{API}/savings/withdraw", json={"amount": 1_000_000.0})
    assert r.status_code == 400


def test_savings_withdraw_success(user_session):
    r = user_session.post(f"{API}/savings/withdraw", json={"amount": 100.0})
    assert r.status_code == 200
    assert r.json()["balance"] == 400.0


def test_transactions_list(user_session):
    r = user_session.get(f"{API}/transactions")
    assert r.status_code == 200
    items = r.json()["items"]
    assert len(items) >= 2
    types = {t["type"] for t in items}
    assert "deposit" in types and "withdraw" in types


# ---------------- Saccos ----------------
@pytest.fixture(scope="module")
def created_sacco(user_session):
    r = user_session.post(f"{API}/saccos", json={"name": f"TEST_Sacco_{uuid.uuid4().hex[:6]}", "description": "test", "goal_amount": 10000})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["member_count"] == 1
    assert data["members"][0]["contribution"] == 0.0
    return data


def test_sacco_list_marks_is_member(user_session, created_sacco):
    r = user_session.get(f"{API}/saccos")
    assert r.status_code == 200
    items = r.json()["items"]
    mine = next((s for s in items if s["id"] == created_sacco["id"]), None)
    assert mine and mine["is_member"] is True


def test_my_saccos(user_session, created_sacco):
    r = user_session.get(f"{API}/saccos/mine")
    assert r.status_code == 200
    items = r.json()["items"]
    assert any(s["id"] == created_sacco["id"] for s in items)
    for s in items:
        assert "my_percentage" in s and "my_contribution" in s


def test_sacco_join_and_contribute(admin_session, user_session, created_sacco):
    sid = created_sacco["id"]
    # admin joins
    r = admin_session.post(f"{API}/saccos/{sid}/join")
    assert r.status_code == 200
    # duplicate join
    r2 = admin_session.post(f"{API}/saccos/{sid}/join")
    assert r2.status_code == 400
    # both contribute
    user_session.post(f"{API}/saccos/{sid}/contribute", json={"amount": 300.0, "sacco_id": sid})
    admin_session.post(f"{API}/saccos/{sid}/contribute", json={"amount": 100.0, "sacco_id": sid})
    r3 = user_session.get(f"{API}/saccos/{sid}")
    data = r3.json()
    total_pct = round(sum(m["percentage"] for m in data["members"]), 1)
    assert total_pct == 100.0, f"Percentages must sum to 100, got {total_pct}"
    assert data["total_balance"] == 400.0


def test_sacco_withdraw_rules(user_session, created_sacco):
    sid = created_sacco["id"]
    # over contribution
    r = user_session.post(f"{API}/saccos/{sid}/withdraw", json={"amount": 99999.0, "sacco_id": sid})
    assert r.status_code == 400
    # valid
    r2 = user_session.post(f"{API}/saccos/{sid}/withdraw", json={"amount": 50.0, "sacco_id": sid})
    assert r2.status_code == 200


# ---------------- Admin ----------------
def test_admin_endpoints_require_admin(user_session):
    for path in ["/admin/users", "/admin/transactions", "/admin/saccos", "/admin/stats"]:
        r = user_session.get(f"{API}{path}")
        assert r.status_code == 403, f"{path} expected 403 got {r.status_code}"


def test_admin_endpoints_admin_ok(admin_session):
    for path in ["/admin/users", "/admin/transactions", "/admin/saccos", "/admin/stats"]:
        r = admin_session.get(f"{API}{path}")
        assert r.status_code == 200, f"{path} -> {r.status_code}: {r.text}"
    stats = admin_session.get(f"{API}/admin/stats").json()
    for k in ["total_users", "total_saccos", "total_personal_savings", "total_sacco_savings", "total_transactions"]:
        assert k in stats
