import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErr("");
        try {
            const u = await login(email, password);
            toast.success(`Welcome back, ${u.name.split(" ")[0]}`);
            const redirect = location.state?.from || (u.role === "admin" ? "/admin" : "/dashboard");
            navigate(redirect, { replace: true });
        } catch (e2) {
            setErr(e2.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            <div className="hidden lg:flex bg-primary text-primary-foreground p-12 flex-col justify-between relative overflow-hidden">
                <div className="absolute inset-0 grain opacity-[0.06] pointer-events-none" />
                <Link to="/" className="font-display font-black text-2xl flex items-center gap-2" data-testid="auth-brand-link">
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary-foreground text-primary">J</span>
                    Jersave
                </Link>
                <div>
                    <h2 className="font-display font-black text-4xl md:text-5xl tracking-tight leading-[1.05]">Welcome back to your savings home.</h2>
                    <p className="mt-5 opacity-80 max-w-md">Pick up where you left off — check your balance, top up a Sacco, or move money back to your M-Pesa.</p>
                </div>
                <div className="text-sm opacity-70">"Akiba ya leo, faraja ya kesho."</div>
            </div>

            <div className="flex items-center justify-center p-6 md:p-12 bg-background">
                <form onSubmit={submit} className="w-full max-w-md" data-testid="login-form">
                    <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Log in</h1>
                    <p className="text-muted-foreground mt-2">New here?{" "}
                        <Link to="/register" className="text-primary font-semibold underline-offset-4 hover:underline" data-testid="login-to-register">Create an account</Link>
                    </p>
                    <div className="mt-8 space-y-5">
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1.5" data-testid="login-email-input" />
                        </div>
                        <div>
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1.5" data-testid="login-password-input" />
                        </div>
                        {err && <div className="text-sm text-destructive" data-testid="login-error">{err}</div>}
                        <Button type="submit" disabled={loading} className="w-full rounded-full" size="lg" data-testid="login-submit-btn">
                            {loading ? "Logging in…" : "Log in"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
