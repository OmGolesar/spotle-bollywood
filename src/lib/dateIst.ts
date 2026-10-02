const IST_OFFSET_MIN = 330;

export function istNow(reference: Date = new Date()): Date {
  const utcMs = reference.getTime() + reference.getTimezoneOffset() * 60_000;
  return new Date(utcMs + IST_OFFSET_MIN * 60_000);
}

export function istDateKey(reference: Date = new Date()): string {
  const ist = istNow(reference);
  const y = ist.getUTCFullYear();
  const m = String(ist.getUTCMonth() + 1).padStart(2, "0");
  const d = String(ist.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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
