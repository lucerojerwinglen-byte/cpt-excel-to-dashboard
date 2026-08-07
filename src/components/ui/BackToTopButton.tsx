import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

const SHOW_AFTER_PX = 600;

export function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > SHOW_AFTER_PX);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed right-6 bottom-6 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-brand-green-400 text-brand-green-900 shadow-[0_4px_16px_rgba(0,33,26,0.35)] transition-all duration-300 hover:bg-brand-green-200 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <ArrowUp size={20} strokeWidth={2.5} />
    </button>
  );
}
