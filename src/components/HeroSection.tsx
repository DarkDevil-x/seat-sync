import { Link } from "react-router-dom";
import { ArrowRight, Zap, Calendar, MapPin } from "lucide-react";

const TRUST_ITEMS = [
  { label: "Live seat maps" },
  { label: "Instant confirmation" },
  { label: "Secure checkout" },
];

const FLOATING_CARDS = [
  {
    title: "Summer Music Fest",
    date: "Sat, Aug 10",
    location: "Central Park, NY",
    price: "$49",
    badge: "Selling fast",
    badgeColor: "bg-orange-500",
  },
  {
    title: "Tech Conference 2025",
    date: "Fri, Sep 5",
    location: "Moscone Center, SF",
    price: "Free",
    badge: "Featured",
    badgeColor: "bg-primary",
  },
];

export function HeroSection() {
  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-background">
      {/* ── Ambient background ────────────────────────────────── */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 dark:opacity-60 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-blue-500/8 blur-[100px] pointer-events-none" />

      <div className="container max-w-7xl mx-auto px-4 py-24 md:py-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* ── Left: Copy ──────────────────────────────────────── */}
          <div className="flex flex-col gap-7">
            {/* Eyebrow badge */}
            <div
              className="inline-flex items-center gap-2 self-start rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5 text-xs font-semibold text-primary animate-fadeIn"
              style={{ animationDelay: "0ms" }}
            >
              <Zap className="h-3 w-3" />
              Real-time seat selection — live updates
            </div>

            {/* Headline */}
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] animate-fadeIn"
              style={{ animationDelay: "60ms" }}
            >
              Book events{" "}
              <span className="gradient-text">you'll love,</span>
              <br />
              seats you'll remember.
            </h1>

            {/* Subtext */}
            <p
              className="text-lg text-muted-foreground max-w-lg leading-relaxed animate-fadeIn"
              style={{ animationDelay: "120ms" }}
            >
              Discover concerts, sports, theatre and more. Reserve your spot in seconds with live seat availability and instant ticket delivery.
            </p>

            {/* CTAs */}
            <div
              className="flex flex-col sm:flex-row gap-3 animate-fadeIn"
              style={{ animationDelay: "180ms" }}
            >
              <Link
                to="/events"
                className="inline-flex items-center justify-center gap-2 gradient-primary rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 hover:opacity-90 hover:shadow-xl hover:shadow-primary/40 active:scale-95 transition-all duration-200"
              >
                Browse Events
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/auth"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background/70 backdrop-blur-sm px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted/60 hover:border-primary/30 active:scale-95 transition-all duration-200"
              >
                Create free account
              </Link>
            </div>

            {/* Trust badges */}
            <div
              className="flex flex-wrap items-center gap-3 animate-fadeIn"
              style={{ animationDelay: "240ms" }}
            >
              {TRUST_ITEMS.map(({ label }) => (
                <span
                  key={label}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  {label}
                </span>
              ))}
            </div>

            {/* Social proof */}
            <div
              className="flex items-center gap-3 animate-fadeIn"
              style={{ animationDelay: "280ms" }}
            >
              <div className="flex -space-x-2">
                {["7", "12", "25", "44"].map((seed) => (
                  <div
                    key={seed}
                    className="h-8 w-8 rounded-full border-2 border-background bg-gradient-to-br from-primary/30 to-violet-400/30 flex items-center justify-center text-[10px] font-bold text-primary"
                  >
                    {seed[0]}
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">1,200+</span> tickets booked this month
              </p>
            </div>
          </div>

          {/* ── Right: Visual ────────────────────────────────────── */}
          <div className="relative hidden lg:flex flex-col gap-4 items-end animate-fadeInScale" style={{ animationDelay: "100ms" }}>
            {/* Main image */}
            <div className="relative w-full rounded-2xl overflow-hidden border border-border shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80"
                alt="Live concert crowd"
                className="w-full aspect-[16/10] object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>

            {/* Floating card 1 */}
            <div
              className="absolute -left-8 top-8 w-64 rounded-2xl border border-border bg-background/90 backdrop-blur-xl p-4 shadow-xl animate-float"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-bold text-foreground leading-tight">{FLOATING_CARDS[0].title}</p>
                <span className={`text-[10px] font-bold text-white rounded-full px-2 py-0.5 ${FLOATING_CARDS[0].badgeColor}`}>
                  {FLOATING_CARDS[0].badge}
                </span>
              </div>
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3 text-primary/60" />{FLOATING_CARDS[0].date}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-primary/60" />{FLOATING_CARDS[0].location}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-extrabold text-foreground">{FLOATING_CARDS[0].price}</span>
                <span className="text-xs text-primary font-semibold">Book now →</span>
              </div>
            </div>

            {/* Floating card 2 */}
            <div
              className="absolute -right-6 bottom-12 w-60 rounded-2xl border border-border bg-background/90 backdrop-blur-xl p-4 shadow-xl animate-float"
              style={{ animationDelay: "0.8s" }}
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-bold text-foreground leading-tight">{FLOATING_CARDS[1].title}</p>
                <span className={`text-[10px] font-bold text-white rounded-full px-2 py-0.5 ${FLOATING_CARDS[1].badgeColor}`}>
                  {FLOATING_CARDS[1].badge}
                </span>
              </div>
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3 text-primary/60" />{FLOATING_CARDS[1].date}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-primary/60" />{FLOATING_CARDS[1].location}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-extrabold text-foreground">{FLOATING_CARDS[1].price}</span>
                <span className="text-xs text-primary font-semibold">Book now →</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
