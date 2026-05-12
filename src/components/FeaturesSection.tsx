import { Search, LayoutGrid, CreditCard, Ticket } from "lucide-react";

const STEPS = [
  {
    number: "01",
    title: "Browse Events",
    description: "Search by city, date, or category. Find concerts, sports, theatre, and more curated for you.",
    icon: Search,
    accent: "bg-primary/10 text-primary dark:bg-primary/15",
    border: "border-primary/20",
  },
  {
    number: "02",
    title: "Pick Your Seats",
    description: "Use our live seat map to see real-time availability and choose exactly where you want to sit.",
    icon: LayoutGrid,
    accent: "bg-blue-500/10 text-blue-500 dark:bg-blue-500/15 dark:text-blue-400",
    border: "border-blue-500/20",
  },
  {
    number: "03",
    title: "Secure Checkout",
    description: "Pay safely and instantly with bank-grade encryption. Your transaction is always protected.",
    icon: CreditCard,
    accent: "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/15 dark:text-emerald-400",
    border: "border-emerald-500/20",
  },
  {
    number: "04",
    title: "Enjoy the Show",
    description: "Get your digital ticket instantly. Scan at the door and enjoy the experience you've been waiting for.",
    icon: Ticket,
    accent: "bg-amber-500/10 text-amber-500 dark:bg-amber-500/15 dark:text-amber-400",
    border: "border-amber-500/20",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 md:py-28 bg-muted/30 relative overflow-hidden border-y border-border/50">

      <div className="container max-w-7xl mx-auto px-4 relative z-10">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 animate-fadeIn">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-semibold text-primary mb-5">
            How it works
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
            From browse to{" "}
            <span className="text-primary">front row</span>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Book any event in 4 simple steps — it takes less than a minute.
          </p>
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((step, i) => (
            <div
              key={step.number}
              className="relative flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg transition-all duration-200 animate-fadeIn"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* Connector line (hidden on last) */}
              {i < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-[2.75rem] left-[calc(100%-0.5rem)] w-[calc(100%+1.5rem)] h-px bg-border z-0 pointer-events-none" />
              )}

              {/* Step number + icon */}
              <div className="flex items-center gap-3">
                <div className={`h-11 w-11 rounded-xl border flex items-center justify-center flex-shrink-0 ${step.accent} ${step.border}`}>
                  <step.icon className="h-5 w-5" />
                </div>
                <span className="text-3xl font-extrabold text-border/60 select-none">{step.number}</span>
              </div>

              {/* Text */}
              <div>
                <h3 className="font-bold text-foreground mb-1.5">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
