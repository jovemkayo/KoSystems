import { useEffect, useState } from "react";

export function useCompactHeader() {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const current = Math.max(0, window.scrollY);
      // Separate thresholds prevent the header's height change from toggling it.
      if (current <= 24) setCompact(false);
      else if (current >= 128) setCompact(true);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return compact;
}
