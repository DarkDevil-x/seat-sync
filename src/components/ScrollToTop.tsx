import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Scroll to top"
      className="fixed bottom-6 right-6 z-50 h-11 w-11 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-150 flex items-center justify-center"
    >
      <ChevronUp className="h-5 w-5" />
    </button>
  );
}
