import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AppShell } from "@/components/Layout";
import api, { formatKES, formatApiErrorDetail } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

export default function SaccoDetail() {
    const { id } = useParams();
    const { user, refresh } = useAuth();
    const [sacco, setSacco] = useState(null);
    const [busy, setBusy] = useState(false);
    const [amount, setAmount] = useState("");
    const [phone, setPhone] = useState(user?.phone || "");

    const load = async () => {
        try {
            const { data } = await api.get(`/saccos/${id}`);
            setSacco(data);
        } catch (e) { toast.error("Could not load sacco"); }
    };
    useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

    const join = async () => {
        try { await api.post(`/saccos/${id}/join`); toast.success("Joined"); await load(); }
        catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail) || e.message); }
    };

    const doAction = async (action) => {
        const amt = parseFloat(amount);
        if (!amt || amt <= 0) return toast.error("Enter a valid amount");
        setBusy(true);
        try {
            await api.post(`/saccos/${id}/${action}`, { amount: amt, phone });
            toast.success(`${action === "contribute" ? "Contributed" : "Withdrew"} ${formatKES(amt)}`);
            setAmount("");
            await Promise.all([refresh(), load()]);
        } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail) || e.message); }
        finally { setBusy(false); }
    };

    if (!sacco) return <AppShell><div className="text-muted-foreground">Loading…</div></AppShell>;

    const myMember = sacco.members.find((m) => m.user_id === user?.id);

    return (
        <AppShell>
            <div className="space-y-8" data-testid="sacco-detail-root">
                <Link to="/saccos" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary" data-testid="back-to-saccos">
                    <ArrowLeft className="w-4 h-4 mr-1" /> All saccos
                </Link>

                <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 bg-card border border-border rounded-3xl p-8">
                        <div className="text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground">Sacco</div>
                        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mt-1" data-testid="sacco-name">{sacco.name}</h1>
                        <p className="text-muted-foreground mt-3 max-w-2xl">{sacco.description || "—"}</p>
                        <div className="mt-6 grid grid-cols-3 gap-4 max-w-md">
                            <div>
                                <div className="text-xs uppercase text-muted-foreground tracking-wider">Total kitty</div>
                                <div className="font-display text-2xl font-black text-primary" data-testid="sacco-total">{formatKES(sacco.total_balance)}</div>
                            </div>
                            <div>
                                <div className="text-xs uppercase text-muted-foreground tracking-wider">Members</div>
                                <div className="font-display text-2xl font-black">{sacco.member_count}</div>
                            </div>
                            <div>
                                <div className="text-xs uppercase text-muted-foreground tracking-wider">Goal</div>
                                <div className="font-display text-2xl font-black">{sacco.goal_amount > 0 ? formatKES(sacco.goal_amount) : "—"}</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-3xl p-8">
                        {!sacco.is_member ? (
                            <div>
                                <h3 className="font-display text-xl font-bold">Join this sacco</h3>
                                <p className="text-sm text-muted-foreground mt-2">Become a member to start contributing.</p>
                                <Button className="rounded-full mt-5 w-full" onClick={join} data-testid="join-this-sacco">Join now</Button>
                            </div>
                        ) : (
                            <div>
                                <div className="text-xs uppercase text-muted-foreground tracking-wider">Your share</div>
                                <div className="font-display text-4xl font-black text-primary" data-testid="my-percentage">{myMember.percentage.toFixed(1)}%</div>
                                <div className="mt-2 text-sm text-muted-foreground">You contributed {formatKES(myMember.contribution)}</div>
                                <Tabs defaultValue="contribute" className="mt-5">
                                    <TabsList className="rounded-full">
                                        <TabsTrigger value="contribute" className="rounded-full" data-testid="sacco-tab-contribute"><ArrowDownRight className="w-4 h-4 mr-1.5" />Add</TabsTrigger>
                                        <TabsTrigger value="withdraw" className="rounded-full" data-testid="sacco-tab-withdraw"><ArrowUpRight className="w-4 h-4 mr-1.5" />Withdraw</TabsTrigger>
                                    </TabsList>
                                    {["contribute", "withdraw"].map((act) => (
                                        <TabsContent key={act} value={act}>
                                            <form className="space-y-3 mt-4" onSubmit={(e) => { e.preventDefault(); doAction(act); }} data-testid={`sacco-${act}-form`}>
                                                <div>
                                                    <Label>Amount (KES)</Label>
                                                    <Input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 500" className="mt-1.5" data-testid={`sacco-${act}-amount`} />
                                                </div>
                                                <div>
                                                    <Label>M-Pesa phone</Label>
                                                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XX XXX XXX" className="mt-1.5" data-testid={`sacco-${act}-phone`} />
                                                </div>
                                                <Button disabled={busy} type="submit" className="rounded-full w-full" data-testid={`sacco-${act}-submit`}>
                                                    {busy ? "Processing…" : act === "contribute" ? "Contribute" : "Withdraw"}
                                                </Button>
                                            </form>
                                        </TabsContent>
                                    ))}
                                </Tabs>
                            </div>
                        )}
                    </div>
                </div>

                {/* Member breakdown */}
                <section>
                    <h2 className="font-display text-xl md:text-2xl font-bold tracking-tight mb-4">Member breakdown</h2>
                    <div className="bg-card border border-border rounded-2xl divide-y divide-border" data-testid="member-breakdown">
                        {sacco.members.length === 0 ? (
                            <div className="p-6 text-muted-foreground">No members yet.</div>
                        ) : sacco.members
                            .slice()
                            .sort((a, b) => b.contribution - a.contribution)
                            .map((m) => (
                                <div key={m.user_id} className="p-5" data-testid={`member-row-${m.user_id}`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <div>
                                            <div className="font-semibold">{m.name}</div>
                                            <div className="text-xs text-muted-foreground">{m.email}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-display text-xl font-black text-primary" data-testid={`member-pct-${m.user_id}`}>{m.percentage.toFixed(1)}%</div>
                                            <div className="text-sm text-muted-foreground">{formatKES(m.contribution)}</div>
                                        </div>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-primary" style={{ width: `${m.percentage}%` }} />
                                    </div>
                                </div>
                            ))}
                    </div>
                </section>
            </div>
        </AppShell>
    );
}
