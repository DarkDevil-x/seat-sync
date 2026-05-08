import { Calendar, CheckCircle2, MapPin, Users, Zap, Shield, Star, Clock } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    title: "Real-time Seat Updates",
    description:
      "See seat availability update in real-time as others book. Never miss out on the best spots.",
    icon: Users,
    gradient: "from-violet-500 to-purple-600",
    glow: "rgba(139,92,246,0.25)",
  },
  {
    title: "Easy Booking Process",
    description:
      "Select your event, choose your seats, and confirm your booking in just a few clicks.",
    icon: CheckCircle2,
    gradient: "from-emerald-500 to-teal-600",
    glow: "rgba(16,185,129,0.25)",
  },
  {
    title: "Location Based Events",
    description:
      "Discover events near you or at your favorite venues around the world.",
    icon: MapPin,
    gradient: "from-blue-500 to-cyan-600",
    glow: "rgba(59,130,246,0.25)",
  },
  {
    title: "Calendar Integration",
    description:
      "Add events to your calendar with a single click. Never miss an event again.",
    icon: Calendar,
    gradient: "from-orange-500 to-amber-600",
    glow: "rgba(245,158,11,0.25)",
  },
  {
    title: "Instant Confirmation",
    description:
      "Get booking confirmations and digital tickets delivered instantly to your inbox.",
    icon: Zap,
    gradient: "from-pink-500 to-rose-600",
    glow: "rgba(236,72,153,0.25)",
  },
  {
    title: "Secure Payments",
    description:
      "Bank-grade security protects every transaction. Your data is always safe with us.",
    icon: Shield,
    gradient: "from-indigo-500 to-blue-600",
    glow: "rgba(99,102,241,0.25)",
  },
  {
    title: "Top Rated Events",
    description:
      "Browse curated, top-rated events verified by our community of event-goers.",
    icon: Star,
    gradient: "from-yellow-500 to-orange-500",
    glow: "rgba(234,179,8,0.25)",
  },
  {
    title: "Flexible Scheduling",
    description:
      "Filter events by date, time, and availability to find what works for your schedule.",
    icon: Clock,
    gradient: "from-teal-500 to-emerald-600",
    glow: "rgba(20,184,166,0.25)",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 md:py-28 bg-slate-50/80 dark:bg-muted/30 relative overflow-hidden border-y border-border/50">
      
      <div className="container max-w-7xl mx-auto px-4 relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-semibold text-primary mb-5">
            <Zap className="h-3.5 w-3.5" />
            Why Choose SeatSync
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-4">
            Features You'll{" "}
            <span className="gradient-text">Love</span>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            SeatSync makes booking your favorite events simple, fast, and enjoyable
            with these powerful features.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.5,
                delay: index * 0.07,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div
                className="group relative flex flex-col gap-4 rounded-3xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-card/50 p-7 cursor-default transition-all duration-300 hover:-translate-y-2 hover:border-primary/30 hover:shadow-xl backdrop-blur-sm shadow-sm"
              >
                {/* Icon */}
                <div
                  className={`h-12 w-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110`}
                >
                  <feature.icon className="h-6 w-6 text-white" />
                </div>

                {/* Text */}
                <div>
                  <h3 className="font-bold text-foreground mb-1.5">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
