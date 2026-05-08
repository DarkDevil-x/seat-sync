import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, TrendingUp, Shield } from "lucide-react";

// ── Animated counter ──────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1800) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const startTime = Date.now();
    const frame = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(frame);
    };
    const raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return count;
}

const stats = [
  { label: "Events Hosted", value: 1200, suffix: "+" },
  { label: "Happy Attendees", value: 50, suffix: "K+" },
  { label: "Cities Covered", value: 30, suffix: "+" },
];

const badges = [
  { icon: Sparkles, label: "Real-time seat selection" },
  { icon: TrendingUp, label: "Live availability" },
  { icon: Shield, label: "Secure checkout" },
];

// ── Individual Stat ───────────────────────────────────────────────────────────
function StatItem({ label, value, suffix, delay }: { label: string; value: number; suffix: string; delay: number }) {
  const count = useCountUp(value, 1600);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="text-center"
    >
      <div className="text-2xl md:text-3xl font-extrabold text-foreground tabular-nums">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-xs md:text-sm text-muted-foreground font-medium mt-0.5">{label}</div>
    </motion.div>
  );
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-purple-950/60 dark:to-slate-900 min-h-[calc(80vh-4rem)] flex items-center -mt-16 pt-16 lg:pt-20">
      {/* ── Noise texture overlay ─────────────────────────────────── */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/60 dark:to-slate-950/60 pointer-events-none" />

      <div className="container relative z-10 py-16 md:py-28 lg:py-32 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-10 items-center">

          {/* ── Left column ─────────────────────────────────────────── */}
          <div className="space-y-7">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="inline-block"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 dark:border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 backdrop-blur-sm">
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="h-1.5 w-1.5 rounded-full bg-purple-400"
                />
                New feature — Live seat selection
              </div>
            </motion.div>

            {/* Heading */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.08]">
                <span className="block">Book events with</span>
                <span className="block bg-gradient-to-r from-purple-400 via-violet-300 to-blue-400 bg-clip-text text-transparent mt-1">
                  real-time updates
                </span>
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed"
            >
              Discover and book seats for the best concerts, sports events, and performances with our
              real-time seat selection system.
            </motion.p>

            {/* Feature badges */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.28 }}
              className="flex flex-wrap gap-2"
            >
              {badges.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 rounded-full bg-slate-900/5 dark:bg-white/6 border border-slate-900/10 dark:border-white/12 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 backdrop-blur-sm"
                >
                  <Icon className="h-3 w-3 text-purple-500 dark:text-purple-400" />
                  {label}
                </div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
                <Link
                  to="/events"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-7 py-3.5 text-base font-bold text-white shadow-xl shadow-purple-500/20 dark:shadow-purple-500/30 hover:shadow-purple-500/30 dark:hover:shadow-purple-500/45 hover:opacity-95 transition-all duration-200"
                >
                  Browse Events
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
                <Link
                  to="/auth"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/20 bg-white/50 dark:bg-white/6 px-7 py-3.5 text-base font-semibold text-slate-700 dark:text-white backdrop-blur-sm hover:bg-slate-50 dark:hover:bg-white/12 hover:border-slate-300 dark:hover:border-white/30 transition-all duration-200 shadow-sm"
                >
                  Create Account
                </Link>
              </motion.div>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="flex items-center gap-3"
            >
              <div className="flex -space-x-2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-background ring-1 ring-border/50"
                    style={{
                      background: `linear-gradient(${135 + i * 30}deg, hsl(${262 + i * 20} 83% 60%), hsl(${221 + i * 15} 83% 55%))`,
                    }}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-bold text-foreground">1,000+</span>{" "}
                users booked this month
              </p>
            </motion.div>
          </div>

          {/* ── Right column ─────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative lg:pl-10"
          >
            {/* Main image */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10 rounded-2xl overflow-hidden border border-slate-200/50 dark:border-white/10 shadow-2xl shadow-purple-900/10 dark:shadow-purple-900/50 ring-1 ring-slate-200 dark:ring-white/5 bg-white dark:bg-transparent"
            >
              <img
                src="https://static.vecteezy.com/system/resources/thumbnails/041/388/388/small/ai-generated-concert-crowd-enjoying-live-music-event-photo.jpg"
                alt="Event booking illustration"
                className="w-full h-auto object-cover aspect-[4/3]"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

              {/* Floating badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="absolute bottom-4 left-4 right-4"
              >
                <div className="flex items-center justify-between rounded-xl bg-black/60 backdrop-blur-md border border-white/10 px-4 py-3">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Live Now</p>
                    <p className="text-sm font-bold text-white">Summer Music Festival</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-300">Seats left</p>
                    <p className="text-sm font-bold text-orange-400">12 remaining</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* ── Stats strip ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.55 }}
          className="mt-12 md:mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-12 border-t border-border/60 pt-10"
        >
          {stats.map((s, i) => (
            <StatItem key={s.label} {...s} delay={0.6 + i * 0.1} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
