import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import api, { formatKES } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowDownRight, ArrowUpRight, Users, PiggyBank, Plus } from "lucide-react";

export default function Dashboard() {
    const { user, refresh } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [mySaccos, setMySaccos] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const [tx, ms] = await Promise.all([api.get("/transactions?limit=8"), api.get("/saccos/mine")]);
            setTransactions(tx.data.items || []);
            setMySaccos(ms.data.items || []);
            await refresh();
        } finally { setLoading(false); }
    };

    useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

    return (
        <AppShell>
            <div className="space-y-8" data-testid="dashboard-root">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <div className="text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground">Dashboard</div>
                        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mt-1">Karibu, {user?.name?.split(" ")[0]}.</h1>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild className="rounded-full" data-testid="dashboard-deposit-btn">
                            <Link to="/savings"><Plus className="w-4 h-4 mr-1.5" /> Deposit</Link>
                        </Button>
                    </div>
                </div>

                {/* Top metrics */}
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 bg-card border border-border rounded-3xl p-8" data-testid="balance-card">
                        <div className="text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground">Total Personal Savings</div>
                        <div className="mt-3 font-display text-5xl md:text-6xl font-black tracking-tighter text-primary" data-testid="balance-amount">
                            {formatKES(user?.savings_balance || 0)}
                        </div>
                        <div className="mt-2 text-muted-foreground text-sm">Safely tucked away from your M-Pesa wallet.</div>
                        <div className="mt-6 flex gap-2">
                            <Button asChild variant="default" className="rounded-full" data-testid="quick-deposit">
                                <Link to="/savings"><ArrowDownRight className="w-4 h-4 mr-1.5" /> Deposit from M-Pesa</Link>
                            </Button>
                            <Button asChild variant="outline" className="rounded-full" data-testid="quick-withdraw">
                                <Link to="/savings"><ArrowUpRight className="w-4 h-4 mr-1.5" /> Withdraw</Link>
                            </Button>
                        </div>
                    </div>
                    <div className="bg-primary text-primary-foreground rounded-3xl p-8" data-testid="saccos-summary-card">
                        <div className="text-xs uppercase tracking-[0.2em] font-semibold opacity-80">Saccos Joined</div>
                        <div className="mt-3 font-display text-5xl font-black tracking-tighter">{mySaccos.length}</div>
                        <div className="mt-2 opacity-80 text-sm">Group savings you belong to.</div>
                        <Button asChild variant="secondary" className="rounded-full mt-6" data-testid="open-saccos">
                            <Link to="/saccos"><Users className="w-4 h-4 mr-1.5" /> Open Saccos</Link>
                        </Button>
                    </div>
                </div>

                {/* My Saccos */}
                <section>
                    <div className="flex items-end justify-between mb-4">
                        <h2 className="font-display text-xl md:text-2xl font-bold tracking-tight">Your Saccos</h2>
                        <Link to="/saccos" className="text-sm text-primary font-semibold" data-testid="see-all-saccos">See all</Link>
                    </div>
                    {mySaccos.length === 0 ? (
                        <div className="bg-card border border-border rounded-2xl p-8 text-center" data-testid="empty-saccos">
                            <PiggyBank className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                            <p className="text-muted-foreground">You haven't joined a Sacco yet.</p>
                            <Button asChild className="rounded-full mt-4" data-testid="empty-saccos-cta">
                                <Link to="/saccos">Explore Saccos</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                            {mySaccos.map((s) => (
                                <Link to={`/saccos/${s.id}`} key={s.id} className="bg-card border border-border rounded-2xl p-6 hover:shadow-md transition-shadow" data-testid={`mysacco-card-${s.id}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-display text-lg font-bold">{s.name}</div>
                                            <div className="text-sm text-muted-foreground">{s.member_count} member{s.member_count !== 1 && "s"}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs uppercase text-muted-foreground tracking-wider">Your share</div>
                                            <div className="font-display text-2xl font-black text-primary" data-testid={`mysacco-pct-${s.id}`}>{s.my_percentage.toFixed(1)}%</div>
                                        </div>
                                    </div>
                                    <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-primary" style={{ width: `${Math.min(s.my_percentage, 100)}%` }} />
                                    </div>
                                    <div className="mt-3 flex justify-between text-sm">
                                        <span className="text-muted-foreground">Your contribution</span>
                                        <span className="font-semibold">{formatKES(s.my_contribution)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Sacco kitty</span>
                                        <span className="font-semibold">{formatKES(s.total_balance)}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>

                {/* Recent activity */}
                <section>
                    <h2 className="font-display text-xl md:text-2xl font-bold tracking-tight mb-4">Recent activity</h2>
                    <div className="bg-card border border-border rounded-2xl divide-y divide-border" data-testid="recent-tx-list">
                        {loading ? (
                            <div className="p-6 text-muted-foreground">Loading…</div>
                        ) : transactions.length === 0 ? (
                            <div className="p-6 text-muted-foreground" data-testid="no-tx">No transactions yet. Make your first deposit!</div>
                        ) : transactions.map((t) => (
                            <div key={t.id} className="p-4 flex items-center justify-between" data-testid={`tx-row-${t.id}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                                        t.type.includes("deposit") ? "bg-primary/10 text-primary" : "bg-secondary/15 text-secondary"
                                    }`}>
                                        {t.type.includes("deposit") ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <div className="font-semibold capitalize">{t.type.replaceAll("_", " ")}</div>
                                        <div className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</div>
                                    </div>
                                </div>
                                <div className={`font-display font-bold ${t.type.includes("deposit") ? "text-primary" : "text-secondary"}`}>
                                    {t.type.includes("deposit") ? "+" : "−"}{formatKES(t.amount)}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </AppShell>
    );
}
