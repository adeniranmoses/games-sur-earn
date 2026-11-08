/**
 * In-House Games Configuration & Logic
 */

export const MAX_SPINS_PER_DAY = 3;

export interface WheelSegment {
  label: string;
  rewardType: "COINS" | "TICKETS";
  amount: number;
  weight: number;
}

export const WHEEL_SEGMENTS: readonly WheelSegment[] = [
  { label: "+25 Coins",   rewardType: "COINS",   amount: 25,  weight: 30 },
  { label: "+30 Tickets", rewardType: "TICKETS", amount: 30,  weight: 25 },
  { label: "+50 Coins",   rewardType: "COINS",   amount: 50,  weight: 20 },
  { label: "+15 Coins",   rewardType: "COINS",   amount: 15,  weight: 12 },
  { label: "+50 Tickets", rewardType: "TICKETS", amount: 50,  weight: 8 },
  { label: "+100 Coins",  rewardType: "COINS",   amount: 100, weight: 4 },
  { label: "+75 Coins",   rewardType: "COINS",   amount: 75,  weight: 4 },
  { label: "JACKPOT 250", rewardType: "COINS",   amount: 250, weight: 1 },
] as const;

/**
 * Weighted random prize selection
 */
export function selectWeightedPrize(randomValue = Math.random()): { index: number; prize: WheelSegment } {
  const totalWeight = WHEEL_SEGMENTS.reduce((sum, s) => sum + s.weight, 0);
  let rand = randomValue * totalWeight;

  for (let i = 0; i < WHEEL_SEGMENTS.length; i++) {
    if (rand < WHEEL_SEGMENTS[i].weight) {
      return { index: i, prize: WHEEL_SEGMENTS[i] };
    }
    rand -= WHEEL_SEGMENTS[i].weight;
  }

  return { index: 0, prize: WHEEL_SEGMENTS[0] };
}
