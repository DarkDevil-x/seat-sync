import { motion } from "framer-motion";

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background">
      {/* Background ambient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
        />
      </div>

      <div className="relative flex flex-col items-center gap-6">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-3 rounded-[22px] border-2 border-dashed border-primary/20"
          />
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center shadow-xl shadow-primary/30">
            <svg
              viewBox="0 0 40 40"
              className="h-9 w-9 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <rect x="4" y="10" width="32" height="22" rx="4" />
              <path d="M12 10V7a8 8 0 0116 0v3" />
              <circle cx="20" cy="21" r="3" fill="currentColor" />
            </svg>
          </div>
          <motion.span
            animate={{ scale: [1, 1.4, 1], opacity: [0.7, 0.3, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-primary"
          />
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
          className="text-center"
        >
          <p className="text-lg font-bold tracking-tight text-foreground">SeatSync</p>
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="text-sm text-muted-foreground mt-1"
          >
            Loading experience…
          </motion.p>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 192 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="h-1 bg-muted rounded-full overflow-hidden"
          style={{ width: 192 }}
        >
          <motion.div
            animate={{ x: ["-100%", "300%"] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            className="h-full w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full"
          />
        </motion.div>
      </div>
    </div>
  );
}
