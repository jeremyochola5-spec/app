import { useEffect, useState } from "react";
import { AppShell } from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import api, { formatKES, formatApiErrorDetail } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

export default function Savings() {
    const { user, refresh } = useAuth();
    const [amount, setAmount] = useState("");
    const [phone, setPhone] = useState(user?.phone || "");
    const [busy, setBusy] = useState(false);
    const [transactions, setTransactions] = useState([]);

    const loadTx = async () => {
        const { data } = await api.get("/transactions?limit=50");
        setTransactions((data.items || []).filter((t) => t.type === "deposit" || t.type === "withdraw"));
    };
    useEffect(() => { loadTx(); }, []);

    const doAction = async (action) => {
        const amt = parseFloat(amount);
        if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
        setBusy(true);
        try {
            await api.post(`/savings/${action}`, { amount: amt, phone });
            toast.success(`${action === "deposit" ? "Deposited" : "Withdrew"} ${formatKES(amt)} successfully`);
            setAmount("");
            await Promise.all([refresh(), loadTx()]);
        } catch (e) {
            toast.error(formatApiErrorDetail(e.response?.data?.detail) || e.message);
        } finally { setBusy(false); }
    };

    return (
        <AppShell>
            <div className="space-y-8" data-testid="savings-root">
                <div>
                    <div className="text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground">Personal Savings</div>
                    <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mt-1">Move money in & out of Jersave.</h1>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 bg-card border border-border rounded-3xl p-8">
                        <div className="text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground">Available balance</div>
                        <div className="mt-3 font-display text-4xl md:text-5xl font-black tracking-tighter text-primary" data-testid="savings-balance">
                            {formatKES(user?.savings_balance || 0)}
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">M-Pesa flows are simulated for now. Real Daraja integration is a switch away.</p>
                    </div>
                    <div className="md:col-span-2 bg-card border border-border rounded-3xl p-8">
                        <Tabs defaultValue="deposit" className="w-full" data-testid="savings-tabs">
                            <TabsList className="rounded-full">
                                <TabsTrigger value="deposit" className="rounded-full" data-testid="tab-deposit">
                                    <ArrowDownRight className="w-4 h-4 mr-1.5" /> Deposit
                                </TabsTrigger>
                                <TabsTrigger value="withdraw" className="rounded-full" data-testid="tab-withdraw">
                                    <ArrowUpRight className="w-4 h-4 mr-1.5" /> Withdraw
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="deposit">
                                <Form busy={busy} amount={amount} setAmount={setAmount} phone={phone} setPhone={setPhone}
                                    action="deposit" onSubmit={() => doAction("deposit")} />
                            </TabsContent>
                            <TabsContent value="withdraw">
                                <Form busy={busy} amount={amount} setAmount={setAmount} phone={phone} setPhone={setPhone}
                                    action="withdraw" onSubmit={() => doAction("withdraw")} />
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>

                {/* History */}
                <section>
                    <h2 className="font-display text-xl md:text-2xl font-bold tracking-tight mb-4">Personal transactions</h2>
                    <div className="bg-card border border-border rounded-2xl divide-y divide-border" data-testid="savings-tx-list">
                        {transactions.length === 0 ? (
                            <div className="p-6 text-muted-foreground" data-testid="no-personal-tx">No personal deposits or withdrawals yet.</div>
                        ) : transactions.map((t) => (
                            <div key={t.id} className="p-4 flex items-center justify-between">
                                <div>
                                    <div className="font-semibold capitalize">{t.type}</div>
                                    <div className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()} • {t.phone || "—"}</div>
                                </div>
                                <div className={`font-display font-bold ${t.type === "deposit" ? "text-primary" : "text-secondary"}`}>
                                    {t.type === "deposit" ? "+" : "−"}{formatKES(t.amount)}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </AppShell>
    );
}

function Form({ busy, amount, setAmount, phone, setPhone, action, onSubmit }) {
    return (
        <form className="mt-6 space-y-4 max-w-md" onSubmit={(e) => { e.preventDefault(); onSubmit(); }} data-testid={`${action}-form`}>
            <div>
                <Label htmlFor={`${action}-amount`}>Amount (KES)</Label>
                <Input id={`${action}-amount`} type="number" min="1" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 500" className="mt-1.5" data-testid={`${action}-amount-input`} />
            </div>
            <div>
                <Label htmlFor={`${action}-phone`}>M-Pesa phone</Label>
                <Input id={`${action}-phone`} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XX XXX XXX" className="mt-1.5" data-testid={`${action}-phone-input`} />
            </div>
            <Button disabled={busy} type="submit" className="rounded-full" data-testid={`${action}-submit-btn`}>
                {busy ? "Processing…" : action === "deposit" ? "Deposit to Jersave" : "Withdraw to M-Pesa"}
            </Button>
        </form>
    );
}
