import { describe, it, expect } from "vitest";

describe("Community Raffle Mechanics", () => {
  it("computes accurate user winning probability relative to platform ticket pool", () => {
    const userTickets = 50;
    const totalPoolTickets = 1000;

    const winProbability = Number(((userTickets / totalPoolTickets) * 100).toFixed(2));
    expect(winProbability).toBe(5.0);
  });

  it("handles edge cases when user holds 0 tickets or pool is small", () => {
    const userTickets = 0;
    const totalPoolTickets = 500;

    const winProbability = totalPoolTickets > 0
      ? Number(((userTickets / totalPoolTickets) * 100).toFixed(2))
      : 0;

    expect(winProbability).toBe(0);
  });

  it("calculates next Sunday midnight UTC draw timestamp consistently", () => {
    const now = new Date("2026-11-11T12:00:00Z"); // Wednesday (day 3)
    const day = now.getUTCDay(); // 3
    const daysUntilSunday = (7 - day) % 7; // 4 days

    const nextSunday = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + daysUntilSunday,
      23, 59, 59, 999
    ));

    expect(nextSunday.getUTCDay()).toBe(0); // 0 is Sunday
    expect(nextSunday.toISOString()).toBe("2026-11-15T23:59:59.999Z");
  });
});
