const IST_OFFSET_MIN = 330;

export function istNow(reference: Date = new Date()): Date {
  return new Date(reference.getTime() + IST_OFFSET_MIN * 60_000);
}

export function istDateKey(reference: Date = new Date()): string {
  const ist = istNow(reference);
  const y = ist.getUTCFullYear();
  const m = String(ist.getUTCMonth() + 1).padStart(2, "0");
  const d = String(ist.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function msUntilNextIstMidnight(reference: Date = new Date()): number {
  const ist = istNow(reference);
  const nextMidnightIstUtcMs = Date.UTC(
    ist.getUTCFullYear(),
    ist.getUTCMonth(),
    ist.getUTCDate() + 1
  );
  const nowAsIstUtcMs = ist.getTime();
  return nextMidnightIstUtcMs - nowAsIstUtcMs;
}

export function formatCountdown(ms: number): string {
  const clamped = Math.max(0, ms);
  const totalSec = Math.floor(clamped / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function istDisplayDate(reference: Date = new Date()): string {
  const ist = istNow(reference);
  return ist.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
