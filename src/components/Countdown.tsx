"use client";

import { useEffect, useState } from "react";
import { formatCountdown, msUntilNextIstMidnight } from "@/lib/dateIst";

export function Countdown() {
  const [ms, setMs] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setMs(msUntilNextIstMidnight());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span
      className="font-display text-2xl font-semibold tabular-nums text-foreground"
      aria-live="polite"
      suppressHydrationWarning
    >
      {ms === null ? "––:––:––" : formatCountdown(ms)}
    </span>
  );
}
