import { useState, useEffect, useRef } from "react";
import { WifiOff, X } from "lucide-react";

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [dismissed, setDismissed] = useState(false);
  const onlineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const goOffline = () => { setIsOffline(true); setDismissed(false); };
    const goOnline = () => {
      setIsOffline(false);
      if (onlineTimerRef.current) clearTimeout(onlineTimerRef.current);
      onlineTimerRef.current = setTimeout(() => setDismissed(true), 3000);
    };

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
      if (onlineTimerRef.current) clearTimeout(onlineTimerRef.current);
    };
  }, []);

  if (!isOffline || dismissed) return null;

  return (
    <div className="fixed top-20 left-0 right-0 z-[9998] px-4 pointer-events-none">
      <div className="max-w-2xl mx-auto pointer-events-auto">
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border-l-4 border-primary bg-primary/10 dark:bg-primary/5 shadow-sm text-sm font-medium text-foreground">
          <WifiOff className="h-4 w-4 text-primary shrink-0" />
          <span className="flex-1">You're offline. Changes will sync when connected.</span>
          <button
            onClick={() => setDismissed(true)}
            className="text-muted-foreground hover:text-foreground transition-colors ml-2"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
