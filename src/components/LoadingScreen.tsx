export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative flex flex-col items-center gap-6 animate-fadeIn">
        {/* Logo */}
        <div className="relative">
          <div className="absolute -inset-3 rounded-[22px] border-2 border-dashed border-primary/20 animate-[spin_3s_linear_infinite]" />
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center shadow-xl shadow-primary/30">
            <svg viewBox="0 0 40 40" className="h-9 w-9 text-white" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="4" y="10" width="32" height="22" rx="4" />
              <path d="M12 10V7a8 8 0 0116 0v3" />
              <circle cx="20" cy="21" r="3" fill="currentColor" />
            </svg>
          </div>
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-primary animate-pulse" />
        </div>

        {/* Text */}
        <div className="text-center">
          <p className="text-lg font-semibold tracking-tight text-foreground">SeatSync</p>
          <p className="text-sm text-muted-foreground mt-1 animate-pulse">Loading experience…</p>
        </div>

        {/* Progress bar */}
        <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full animate-[slide-bar_1.4s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}
