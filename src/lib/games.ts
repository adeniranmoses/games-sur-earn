/**
 * In-House Games Configuration & Logic
 */
import crypto from "crypto";

export const MAX_SPINS_PER_DAY = 3;
export const MAX_SCRATCHES_PER_DAY = 3;

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
 * Weighted random prize selection for Lucky Spin
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

// ─────────────────────────────────────────────────────────────
// SCRATCH & WIN GAME LOGIC
// ─────────────────────────────────────────────────────────────
export interface ScratchPrize {
  label: string;
  rewardType: "COINS" | "TICKETS";
  amount: number;
  weight: number;
  symbol: string;
}

export const SCRATCH_PRIZES: readonly ScratchPrize[] = [
  { label: "50 Coins",    rewardType: "COINS",   amount: 50,  weight: 40, symbol: "💰" },
  { label: "100 Coins",   rewardType: "COINS",   amount: 100, weight: 25, symbol: "🪙" },
  { label: "50 Tickets",  rewardType: "TICKETS", amount: 50,  weight: 20, symbol: "🎟️" },
  { label: "250 Coins",   rewardType: "COINS",   amount: 250, weight: 10, symbol: "💎" },
  { label: "500 Coins",   rewardType: "COINS",   amount: 500, weight: 4,  symbol: "👑" },
  { label: "JACKPOT 1,000", rewardType: "COINS", amount: 1000, weight: 1, symbol: "🏆" },
] as const;

export function selectWeightedScratchPrize(randomValue = Math.random()): ScratchPrize {
  const totalWeight = SCRATCH_PRIZES.reduce((sum, s) => sum + s.weight, 0);
  let rand = randomValue * totalWeight;

  for (let i = 0; i < SCRATCH_PRIZES.length; i++) {
    if (rand < SCRATCH_PRIZES[i].weight) {
      return SCRATCH_PRIZES[i];
    }
    rand -= SCRATCH_PRIZES[i].weight;
  }

  return SCRATCH_PRIZES[0];
}

/**
 * Signs a tamper-proof session token for Scratch Card with HMAC-SHA256
 */
export function signScratchSession(
  userId: string,
  prizeIndex: number,
  nonce: string,
  secret: string
): string {
  const payload = JSON.stringify({ userId, prizeIndex, nonce, createdAt: Date.now() });
  const b64Payload = Buffer.from(payload).toString("base64url");
  const hmac = crypto.createHmac("sha256", secret).update(b64Payload).digest("hex");
  return `${b64Payload}.${hmac}`;
}

export function verifyScratchSession(
  token: string,
  secret: string
): { userId: string; prizeIndex: number; nonce: string; createdAt: number } | null {
  try {
    const [b64Payload, receivedHmac] = token.split(".");
    if (!b64Payload || !receivedHmac) return null;

    const expectedHmac = crypto.createHmac("sha256", secret).update(b64Payload).digest("hex");
    if (
      !crypto.timingSafeEqual(
        Buffer.from(expectedHmac, "hex"),
        Buffer.from(receivedHmac, "hex")
      )
    ) {
      return null;
    }

    const json = JSON.parse(Buffer.from(b64Payload, "base64url").toString("utf8"));
    return json;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// PROVABLY FAIR COIN FLIP LOGIC
// ─────────────────────────────────────────────────────────────
export function evaluateCoinFlip(serverSeed: string, clientSeed: string, nonce: number): "HEADS" | "TAILS" {
  const hash = crypto
    .createHmac("sha256", serverSeed)
    .update(`${clientSeed}:${nonce}`)
    .digest("hex");

  // Take the first 8 hex characters and calculate integer
  const sub = parseInt(hash.substring(0, 8), 16);
  // Standard 50/50 probability (with 0.49 house RTP or true 50/50)
  return sub % 2 === 0 ? "HEADS" : "TAILS";
}
