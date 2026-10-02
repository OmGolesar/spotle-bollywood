import { describe, it, expect } from "vitest";
import {
  istDateKey,
  istNow,
  istDisplayDate,
  msUntilNextIstMidnight,
  formatCountdown,
} from "./dateIst";

describe("istDateKey", () => {
  it("returns YYYY-MM-DD in IST", () => {
    const ref = new Date("2026-10-02T12:00:00Z");
    expect(istDateKey(ref)).toBe("2026-10-02");
  });

  it("rolls to the next IST day after 18:30 UTC on 23:59 IST → 00:00 IST", () => {
    const beforeMidnight = new Date("2026-10-02T18:29:00Z");
    const afterMidnight = new Date("2026-10-02T18:30:00Z");
    expect(istDateKey(beforeMidnight)).toBe("2026-10-02");
    expect(istDateKey(afterMidnight)).toBe("2026-10-03");
  });

  it("handles the UTC day boundary without flipping the IST key", () => {
    const utcNewYearEve = new Date("2026-12-31T23:00:00Z");
    expect(istDateKey(utcNewYearEve)).toBe("2027-01-01");
  });

  it("stays IST regardless of system timezone — IST offset is fixed at +05:30", () => {
    const ref = new Date("2026-03-14T18:29:59Z");
    expect(istDateKey(ref)).toBe("2026-03-14");
    const ref2 = new Date("2026-03-14T18:30:00Z");
    expect(istDateKey(ref2)).toBe("2026-03-15");
  });
});

describe("istNow", () => {
  it("adds 5:30 to the input UTC time (encoded as a Date in UTC fields)", () => {
    const ref = new Date("2026-10-02T00:00:00Z");
    const ist = istNow(ref);
    expect(ist.getUTCHours()).toBe(5);
    expect(ist.getUTCMinutes()).toBe(30);
    expect(ist.getUTCDate()).toBe(2);
  });
});

describe("msUntilNextIstMidnight", () => {
  it("is 24h at IST midnight", () => {
    const istMidnight = new Date("2026-10-02T18:30:00Z");
    const ms = msUntilNextIstMidnight(istMidnight);
    expect(ms).toBe(24 * 60 * 60 * 1000);
  });

  it("is 1 hour when it is 23:00 IST", () => {
    const t = new Date("2026-10-02T17:30:00Z");
    const ms = msUntilNextIstMidnight(t);
    expect(ms).toBe(60 * 60 * 1000);
  });

  it("is 1 second just before midnight", () => {
    const t = new Date("2026-10-02T18:29:59Z");
    const ms = msUntilNextIstMidnight(t);
    expect(ms).toBe(1000);
  });

  it("is positive at all times", () => {
    for (const iso of [
      "2026-01-01T00:00:00Z",
      "2026-03-14T18:29:59Z",
      "2026-07-04T12:00:00Z",
      "2026-12-31T23:59:59Z",
    ]) {
      const ms = msUntilNextIstMidnight(new Date(iso));
      expect(ms).toBeGreaterThan(0);
      expect(ms).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
    }
  });
});

describe("formatCountdown", () => {
  it("formats hh:mm:ss with zero padding", () => {
    expect(formatCountdown(0)).toBe("00:00:00");
    expect(formatCountdown(1000)).toBe("00:00:01");
    expect(formatCountdown(60_000)).toBe("00:01:00");
    expect(formatCountdown(3_600_000)).toBe("01:00:00");
    expect(formatCountdown(24 * 60 * 60 * 1000 - 1000)).toBe("23:59:59");
  });

  it("clamps negatives to 00:00:00", () => {
    expect(formatCountdown(-5000)).toBe("00:00:00");
  });
});

describe("istDisplayDate", () => {
  it("returns a non-empty localized string for a known date", () => {
    const s = istDisplayDate(new Date("2026-10-02T06:00:00Z"));
    expect(s).toContain("2026");
    expect(s.length).toBeGreaterThan(5);
  });
});
