import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const goOffline = () => { setIsOffline(true); setWasOffline(true); };
    const goOnline = () => {
      setIsOffline(false);
      setTimeout(() => setWasOffline(false), 3000);
    };

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!isOffline && !wasOffline) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[9998] flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium transition-all duration-500 ${
        isOffline
          ? "bg-destructive text-destructive-foreground"
          : "bg-green-500 text-white"
      }`}
    >
      {isOffline ? (
        <>
          <WifiOff className="h-4 w-4" />
          You are offline — some features may not be available
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Back online!
        </>
      )}
    </div>
  );
}
