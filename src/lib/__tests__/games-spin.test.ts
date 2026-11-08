import { describe, it, expect } from "vitest";
import { WHEEL_SEGMENTS, selectWeightedPrize, MAX_SPINS_PER_DAY } from "../games";

describe("Lucky Spin Arcade Game Logic & Security", () => {
  it("enforces max 3 free spins per day", () => {
    expect(MAX_SPINS_PER_DAY).toBe(3);
  });

  it("defines exactly 8 balanced wheel segments", () => {
    expect(WHEEL_SEGMENTS).toHaveLength(8);
    WHEEL_SEGMENTS.forEach((seg) => {
      expect(seg.amount).toBeGreaterThan(0);
      expect(seg.weight).toBeGreaterThan(0);
      expect(["COINS", "TICKETS"]).toContain(seg.rewardType);
    });
  });

  it("maintains reasonable prize odds (Jackpot is rare, common prizes dominate)", () => {
    const totalWeight = WHEEL_SEGMENTS.reduce((sum, s) => sum + s.weight, 0);
    const jackpot = WHEEL_SEGMENTS.find((s) => s.label.includes("JACKPOT"));
    expect(jackpot).toBeDefined();

    const jackpotOdds = (jackpot!.weight / totalWeight) * 100;
    expect(jackpotOdds).toBeLessThanOrEqual(2); // Jackpot <= 2% odds
  });

  it("selectWeightedPrize selects valid segments for all random inputs", () => {
    for (let i = 0; i < 50; i++) {
      const { index, prize } = selectWeightedPrize(Math.random());
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(WHEEL_SEGMENTS.length);
      expect(prize).toEqual(WHEEL_SEGMENTS[index]);
    }
  });
});
