import { useEffect, useState } from "react";
import { AppShell } from "@/components/Layout";
import api, { formatKES } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Users, PiggyBank, Wallet, ShieldCheck, Activity } from "lucide-react";

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [saccos, setSaccos] = useState([]);
    const [txs, setTxs] = useState([]);

    useEffect(() => {
        (async () => {
            const [s, u, sa, t] = await Promise.all([
                api.get("/admin/stats"),
                api.get("/admin/users"),
                api.get("/admin/saccos"),
                api.get("/admin/transactions"),
            ]);
            setStats(s.data);
            setUsers(u.data.items || []);
            setSaccos(sa.data.items || []);
            setTxs(t.data.items || []);
        })();
    }, []);

    const Stat = ({ icon: Icon, label, value, accent }) => (
        <div className={`rounded-2xl p-6 border ${accent ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}>
            <div className="flex justify-between items-start">
                <div>
                    <div className={`text-xs uppercase tracking-[0.2em] font-semibold ${accent ? "opacity-80" : "text-muted-foreground"}`}>{label}</div>
                    <div className="font-display text-3xl font-black mt-2">{value}</div>
                </div>
                <Icon className="w-6 h-6 opacity-80" />
            </div>
        </div>
    );

    return (
        <AppShell>
            <div className="space-y-8" data-testid="admin-root">
                <div>
                    <div className="text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground inline-flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5" /> Admin
                    </div>
                    <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mt-1">Platform overview</h1>
                </div>

                {stats && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        <Stat icon={Users} label="Users" value={stats.total_users} accent />
                        <Stat icon={PiggyBank} label="Saccos" value={stats.total_saccos} />
                        <Stat icon={Wallet} label="Personal savings" value={formatKES(stats.total_personal_savings)} />
                        <Stat icon={Wallet} label="Sacco savings" value={formatKES(stats.total_sacco_savings)} />
                        <Stat icon={Activity} label="Transactions" value={stats.total_transactions} />
                    </div>
                )}

                <Tabs defaultValue="users" className="w-full" data-testid="admin-tabs">
                    <TabsList className="rounded-full">
                        <TabsTrigger value="users" className="rounded-full" data-testid="admin-tab-users">Users</TabsTrigger>
                        <TabsTrigger value="saccos" className="rounded-full" data-testid="admin-tab-saccos">Saccos</TabsTrigger>
                        <TabsTrigger value="transactions" className="rounded-full" data-testid="admin-tab-tx">Transactions</TabsTrigger>
                    </TabsList>

                    <TabsContent value="users">
                        <div className="bg-card border border-border rounded-2xl overflow-hidden mt-4">
                            <Table data-testid="admin-users-table">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead className="text-right">Savings</TableHead>
                                        <TableHead>Joined</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((u) => (
                                        <TableRow key={u.id} data-testid={`admin-user-${u.id}`}>
                                            <TableCell className="font-semibold">{u.name}</TableCell>
                                            <TableCell>{u.email}</TableCell>
                                            <TableCell>{u.phone || "—"}</TableCell>
                                            <TableCell>
                                                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${u.role === "admin" ? "bg-secondary/15 text-secondary" : "bg-primary/10 text-primary"}`}>{u.role}</span>
                                            </TableCell>
                                            <TableCell className="text-right">{formatKES(u.savings_balance || 0)}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    <TabsContent value="saccos">
                        <div className="bg-card border border-border rounded-2xl overflow-hidden mt-4">
                            <Table data-testid="admin-saccos-table">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Members</TableHead>
                                        <TableHead className="text-right">Total kitty</TableHead>
                                        <TableHead className="text-right">Goal</TableHead>
                                        <TableHead>Created</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {saccos.map((s) => (
                                        <TableRow key={s.id} data-testid={`admin-sacco-${s.id}`}>
                                            <TableCell className="font-semibold">{s.name}</TableCell>
                                            <TableCell>{s.member_count}</TableCell>
                                            <TableCell className="text-right">{formatKES(s.total_balance)}</TableCell>
                                            <TableCell className="text-right">{s.goal_amount > 0 ? formatKES(s.goal_amount) : "—"}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    <TabsContent value="transactions">
                        <div className="bg-card border border-border rounded-2xl overflow-hidden mt-4">
                            <Table data-testid="admin-tx-table">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>When</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead>Sacco</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {txs.map((t) => (
                                        <TableRow key={t.id} data-testid={`admin-tx-${t.id}`}>
                                            <TableCell className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</TableCell>
                                            <TableCell className="capitalize">{t.type.replaceAll("_", " ")}</TableCell>
                                            <TableCell className="text-xs">{t.user_id.slice(0, 8)}…</TableCell>
                                            <TableCell className="text-right font-semibold">{formatKES(t.amount)}</TableCell>
                                            <TableCell className="text-xs">{t.sacco_id ? t.sacco_id.slice(0, 8) + "…" : "—"}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </AppShell>
    );
}
