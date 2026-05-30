import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/Layout";
import api, { formatKES, formatApiErrorDetail } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Users } from "lucide-react";
import { toast } from "sonner";

export default function Saccos() {
    const [saccos, setSaccos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({ name: "", description: "", goal_amount: "" });
    const [open, setOpen] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await api.get("/saccos");
            setSaccos(data.items || []);
        } finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const create = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            await api.post("/saccos", { ...form, goal_amount: parseFloat(form.goal_amount || 0) });
            toast.success("Sacco created");
            setOpen(false);
            setForm({ name: "", description: "", goal_amount: "" });
            await load();
        } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail) || e.message); }
        finally { setCreating(false); }
    };

    const join = async (id) => {
        try {
            await api.post(`/saccos/${id}/join`);
            toast.success("Joined sacco");
            await load();
        } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail) || e.message); }
    };

    return (
        <AppShell>
            <div className="space-y-8" data-testid="saccos-root">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <div className="text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground">Saccos</div>
                        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mt-1">Group savings, transparent shares.</h1>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="rounded-full" data-testid="create-sacco-btn"><Plus className="w-4 h-4 mr-1.5" /> Create Sacco</Button>
                        </DialogTrigger>
                        <DialogContent data-testid="create-sacco-dialog">
                            <DialogHeader>
                                <DialogTitle className="font-display">Create a new Sacco</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={create} className="space-y-4">
                                <div>
                                    <Label htmlFor="s-name">Sacco name</Label>
                                    <Input id="s-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Family Kitty" className="mt-1.5" data-testid="sacco-name-input" />
                                </div>
                                <div>
                                    <Label htmlFor="s-desc">Description</Label>
                                    <Textarea id="s-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What is this Sacco for?" className="mt-1.5" data-testid="sacco-desc-input" />
                                </div>
                                <div>
                                    <Label htmlFor="s-goal">Goal amount (optional)</Label>
                                    <Input id="s-goal" type="number" min="0" value={form.goal_amount} onChange={(e) => setForm({ ...form, goal_amount: e.target.value })} placeholder="e.g. 50000" className="mt-1.5" data-testid="sacco-goal-input" />
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={creating} className="rounded-full" data-testid="sacco-create-submit">
                                        {creating ? "Creating…" : "Create Sacco"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {loading ? (
                    <div className="text-muted-foreground">Loading saccos…</div>
                ) : saccos.length === 0 ? (
                    <div className="bg-card border border-border rounded-2xl p-10 text-center" data-testid="no-saccos">
                        <Users className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                        <p className="text-muted-foreground">No saccos yet. Be the first to create one!</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {saccos.map((s) => (
                            <div key={s.id} className="bg-card border border-border rounded-2xl p-6 flex flex-col" data-testid={`sacco-card-${s.id}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-display text-lg font-bold">{s.name}</div>
                                        <div className="text-sm text-muted-foreground">{s.member_count} member{s.member_count !== 1 && "s"}</div>
                                    </div>
                                    {s.is_member && <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold">Joined</span>}
                                </div>
                                <p className="mt-3 text-sm text-muted-foreground line-clamp-3 min-h-[3em]">{s.description || "—"}</p>
                                <div className="mt-4">
                                    <div className="text-xs uppercase text-muted-foreground tracking-wider">Total kitty</div>
                                    <div className="font-display text-2xl font-black text-primary">{formatKES(s.total_balance)}</div>
                                </div>
                                {s.goal_amount > 0 && (
                                    <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-primary" style={{ width: `${Math.min((s.total_balance / s.goal_amount) * 100, 100)}%` }} />
                                    </div>
                                )}
                                <div className="mt-5 flex gap-2">
                                    <Button asChild variant="outline" className="rounded-full flex-1" data-testid={`view-sacco-${s.id}`}>
                                        <Link to={`/saccos/${s.id}`}>View</Link>
                                    </Button>
                                    {!s.is_member && (
                                        <Button onClick={() => join(s.id)} className="rounded-full flex-1" data-testid={`join-sacco-${s.id}`}>Join</Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppShell>
    );
}
