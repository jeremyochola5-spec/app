import { Link } from "react-router-dom";
import { PublicNav } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, PiggyBank, Users, ShieldCheck, Banknote, ChartPie, Sparkles } from "lucide-react";

export default function Landing() {
    return (
        <div className="bg-background">
            <PublicNav />

            {/* Hero */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 hero-blob opacity-80 pointer-events-none" />
                <div className="max-w-7xl mx-auto px-4 md:px-8 pt-16 md:pt-24 pb-20 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center relative">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold uppercase tracking-[0.2em] mb-6" data-testid="hero-badge">
                            <Sparkles className="w-3 h-3" /> Built for Kenya
                        </div>
                        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.05]">
                            Save smarter, <span className="text-primary">together</span>. Right from your M-Pesa.
                        </h1>
                        <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
                            Jersave moves money out of temptation. Stash personal savings away from your M-Pesa wallet, and team up in <span className="text-foreground font-semibold">Saccos</span> where every shilling is tracked transparently.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Button asChild size="lg" className="rounded-full" data-testid="hero-cta-register">
                                <Link to="/register">Start saving free <ArrowRight className="w-4 h-4 ml-1.5" /></Link>
                            </Button>
                            <Button asChild size="lg" variant="outline" className="rounded-full" data-testid="hero-cta-login">
                                <Link to="/login">I already have an account</Link>
                            </Button>
                        </div>
                        <div className="mt-10 grid grid-cols-3 gap-6 max-w-md">
                            <div><div className="text-2xl font-display font-black text-primary">0%</div><div className="text-xs text-muted-foreground uppercase tracking-wider">Hidden fees</div></div>
                            <div><div className="text-2xl font-display font-black text-primary">24/7</div><div className="text-xs text-muted-foreground uppercase tracking-wider">Withdraw</div></div>
                            <div><div className="text-2xl font-display font-black text-primary">∞</div><div className="text-xs text-muted-foreground uppercase tracking-wider">Saccos</div></div>
                        </div>
                    </div>
                    <div className="relative">
                        <img
                            src="https://static.prod-images.emergentagent.com/jobs/df65df23-48f2-400b-8fab-a92f44df6424/images/2d310272651cb2324b40c4cd441df8047e47bb00a178c5dad69ee345881d8063.png"
                            alt="Jersave abstract savings"
                            className="rounded-3xl border border-border w-full h-auto"
                            data-testid="hero-image"
                        />
                    </div>
                </div>
            </section>

            {/* Features Bento */}
            <section id="features" className="max-w-7xl mx-auto px-4 md:px-8 py-20">
                <div className="mb-12 max-w-2xl">
                    <div className="text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-3">Why Jersave</div>
                    <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">A vault for your shillings, a stage for your group.</h2>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 bg-card border border-border rounded-3xl p-8 md:p-10" data-testid="feature-personal">
                        <div className="inline-flex w-12 h-12 rounded-2xl bg-primary text-primary-foreground items-center justify-center mb-5">
                            <PiggyBank className="w-6 h-6" />
                        </div>
                        <h3 className="font-display text-xl md:text-2xl font-bold mb-2">Personal Savings, out of reach.</h3>
                        <p className="text-muted-foreground leading-relaxed">Deposit any amount from M-Pesa straight into your private Jersave wallet. The money sits aside so you don't spend it by accident — and you can pull it back any time you need.</p>
                    </div>
                    <div className="bg-primary text-primary-foreground rounded-3xl p-8 md:p-10" data-testid="feature-instant">
                        <Banknote className="w-8 h-8 mb-5" />
                        <h3 className="font-display text-xl md:text-2xl font-bold mb-2">Withdraw whenever.</h3>
                        <p className="opacity-80 leading-relaxed">No lock-in. No waiting. Your money is yours.</p>
                    </div>
                    <div className="bg-secondary text-secondary-foreground rounded-3xl p-8 md:p-10" data-testid="feature-percent">
                        <ChartPie className="w-8 h-8 mb-5" />
                        <h3 className="font-display text-xl md:text-2xl font-bold mb-2">% per member.</h3>
                        <p className="opacity-90 leading-relaxed">Every Sacco shows the exact contribution share of each member. Trust through transparency.</p>
                    </div>
                    <div className="md:col-span-2 bg-card border border-border rounded-3xl p-8 md:p-10" data-testid="feature-sacco">
                        <div className="inline-flex w-12 h-12 rounded-2xl bg-accent text-accent-foreground items-center justify-center mb-5">
                            <Users className="w-6 h-6" />
                        </div>
                        <h3 className="font-display text-xl md:text-2xl font-bold mb-2">Saccos that just work.</h3>
                        <p className="text-muted-foreground leading-relaxed">Start a Sacco for chama, family or workmates. Invite people, contribute together, and watch each member's percentage update live as the kitty grows.</p>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section id="how" className="bg-muted">
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-20">
                    <div className="mb-12 max-w-2xl">
                        <div className="text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-3">How it works</div>
                        <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">Three steps from M-Pesa to a real savings habit.</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { n: "01", t: "Create your account", d: "Sign up with your name, email and phone. Free, forever." },
                            { n: "02", t: "Deposit from M-Pesa", d: "Move any amount into your Jersave wallet. Solo or into a Sacco kitty." },
                            { n: "03", t: "Watch it grow", d: "Track your balance, your share, and your group's progress on one dashboard." },
                        ].map((s) => (
                            <div key={s.n} className="bg-card border border-border rounded-2xl p-8" data-testid={`step-${s.n}`}>
                                <div className="text-xs font-display font-black text-secondary tracking-widest">{s.n}</div>
                                <h3 className="font-display text-xl font-bold mt-2">{s.t}</h3>
                                <p className="text-muted-foreground mt-2 leading-relaxed">{s.d}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Saccos showcase */}
            <section id="saccos" className="max-w-7xl mx-auto px-4 md:px-8 py-20 grid lg:grid-cols-2 gap-12 items-center">
                <img
                    src="https://images.pexels.com/photos/3768884/pexels-photo-3768884.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
                    alt="Friends saving together"
                    className="rounded-3xl border border-border w-full h-auto"
                    data-testid="saccos-image"
                />
                <div>
                    <div className="text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-3">Saccos</div>
                    <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">Save as a team. See exactly who put what.</h2>
                    <p className="text-muted-foreground mt-5 leading-relaxed">No more arguments at end-of-year payouts. Each member's percentage is calculated live based on what they've actually contributed to the Sacco kitty.</p>
                    <div className="mt-8 flex gap-3">
                        <Button asChild className="rounded-full" data-testid="saccos-cta">
                            <Link to="/register">Start a Sacco</Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* CTA footer */}
            <section className="bg-primary text-primary-foreground">
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-20 text-center">
                    <h2 className="font-display text-3xl md:text-5xl font-black tracking-tight max-w-3xl mx-auto">
                        Your future self will thank you for opening Jersave today.
                    </h2>
                    <div className="mt-8">
                        <Button asChild size="lg" variant="secondary" className="rounded-full" data-testid="footer-cta">
                            <Link to="/register">Create my Jersave account <ArrowRight className="w-4 h-4 ml-1.5" /></Link>
                        </Button>
                    </div>
                </div>
            </section>
            <footer className="border-t border-border">
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 text-sm text-muted-foreground flex justify-between flex-wrap gap-4">
                    <div>© {new Date().getFullYear()} Jersave. All rights reserved.</div>
                    <div className="flex gap-6">
                        <ShieldCheck className="w-4 h-4 inline mr-1" /> Built with care for the Kenyan saver.
                    </div>
                </div>
            </footer>
        </div>
    );
}
