import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErr("");
        try {
            const u = await register(form);
            toast.success(`Welcome to Jersave, ${u.name.split(" ")[0]}!`);
            navigate("/dashboard", { replace: true });
        } catch (e2) {
            setErr(e2.message);
        } finally {
            setLoading(false);
        }
    };

    const onChange = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            <div className="flex items-center justify-center p-6 md:p-12 bg-background order-2 lg:order-1">
                <form onSubmit={submit} className="w-full max-w-md" data-testid="register-form">
                    <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Open your Jersave</h1>
                    <p className="text-muted-foreground mt-2">Already saving with us?{" "}
                        <Link to="/login" className="text-primary font-semibold underline-offset-4 hover:underline" data-testid="register-to-login">Log in</Link>
                    </p>
                    <div className="mt-8 space-y-5">
                        <div>
                            <Label htmlFor="name">Full name</Label>
                            <Input id="name" required value={form.name} onChange={onChange("name")} placeholder="e.g. Achieng Otieno" className="mt-1.5" data-testid="register-name-input" />
                        </div>
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" required value={form.email} onChange={onChange("email")} placeholder="you@example.com" className="mt-1.5" data-testid="register-email-input" />
                        </div>
                        <div>
                            <Label htmlFor="phone">M-Pesa phone (optional)</Label>
                            <Input id="phone" value={form.phone} onChange={onChange("phone")} placeholder="07XX XXX XXX" className="mt-1.5" data-testid="register-phone-input" />
                        </div>
                        <div>
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" required minLength={6} value={form.password} onChange={onChange("password")} placeholder="At least 6 characters" className="mt-1.5" data-testid="register-password-input" />
                        </div>
                        {err && <div className="text-sm text-destructive" data-testid="register-error">{err}</div>}
                        <Button type="submit" disabled={loading} className="w-full rounded-full" size="lg" data-testid="register-submit-btn">
                            {loading ? "Creating…" : "Create my Jersave"}
                        </Button>
                    </div>
                </form>
            </div>
            <div className="hidden lg:flex bg-secondary text-secondary-foreground p-12 flex-col justify-between relative overflow-hidden order-1 lg:order-2">
                <div className="absolute inset-0 grain opacity-[0.08] pointer-events-none" />
                <div></div>
                <div>
                    <h2 className="font-display font-black text-4xl md:text-5xl tracking-tight leading-[1.05]">Start small. Save together. See it grow.</h2>
                    <p className="mt-5 opacity-90 max-w-md">Open a free Jersave wallet in under a minute. Move money from M-Pesa whenever you want, and join Saccos with people you trust.</p>
                </div>
                <div className="text-sm opacity-80">"Haba na haba hujaza kibaba."</div>
            </div>
        </div>
    );
}
