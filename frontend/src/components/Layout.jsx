import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, PiggyBank, Users, ShieldCheck, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

export function PublicNav() {
    const { user } = useAuth();
    return (
        <header className="sticky top-0 z-40 glass-nav">
            <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 font-display font-black text-xl text-primary" data-testid="brand-link">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">J</span>
                    Jersave
                </Link>
                <nav className="hidden md:flex items-center gap-8 text-sm">
                    <a href="#features" className="hover:text-primary transition-colors" data-testid="nav-features">Features</a>
                    <a href="#saccos" className="hover:text-primary transition-colors" data-testid="nav-saccos">Saccos</a>
                    <a href="#how" className="hover:text-primary transition-colors" data-testid="nav-how">How it works</a>
                </nav>
                <div className="flex items-center gap-2">
                    {user && user !== false ? (
                        <Button asChild className="rounded-full" data-testid="nav-dashboard-btn">
                            <Link to="/dashboard">Go to dashboard</Link>
                        </Button>
                    ) : (
                        <>
                            <Button asChild variant="ghost" className="rounded-full" data-testid="nav-login-btn">
                                <Link to="/login">Log in</Link>
                            </Button>
                            <Button asChild className="rounded-full" data-testid="nav-register-btn">
                                <Link to="/register">Get started</Link>
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}

export function AppShell({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate("/");
    };

    const links = [
        { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", testid: "side-dashboard" },
        { to: "/savings", icon: PiggyBank, label: "Savings", testid: "side-savings" },
        { to: "/saccos", icon: Users, label: "Saccos", testid: "side-saccos" },
    ];
    if (user && user.role === "admin") {
        links.push({ to: "/admin", icon: ShieldCheck, label: "Admin", testid: "side-admin" });
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-40 glass-nav">
                <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button className="md:hidden" onClick={() => setOpen(!open)} data-testid="mobile-menu-toggle">
                            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                        <Link to="/dashboard" className="flex items-center gap-2 font-display font-black text-xl text-primary" data-testid="app-brand">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">J</span>
                            Jersave
                        </Link>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="hidden sm:inline text-sm text-muted-foreground" data-testid="current-user-name">
                            Hi, {user?.name?.split(" ")[0] || "friend"}
                        </span>
                        <Button onClick={handleLogout} variant="outline" size="sm" className="rounded-full" data-testid="logout-btn">
                            <LogOut className="w-4 h-4 mr-1.5" /> Log out
                        </Button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 grid md:grid-cols-[220px_1fr] gap-8">
                <aside className={`${open ? "block" : "hidden"} md:block`}>
                    <nav className="bg-card border border-border rounded-2xl p-3 sticky top-24">
                        {links.map(({ to, icon: Icon, label, testid }) => (
                            <NavLink
                                key={to}
                                to={to}
                                onClick={() => setOpen(false)}
                                data-testid={testid}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                        isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
                                    }`
                                }
                            >
                                <Icon className="w-4 h-4" /> {label}
                            </NavLink>
                        ))}
                    </nav>
                </aside>
                <main className="min-w-0">{children}</main>
            </div>
        </div>
    );
}
