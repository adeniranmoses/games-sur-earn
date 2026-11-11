import { describe, it, expect } from "vitest";
import {
  selectWeightedScratchPrize,
  signScratchSession,
  verifyScratchSession,
  evaluateCoinFlip,
  SCRATCH_PRIZES,
} from "../games";

describe("Arcade Games & Provably Fair Logic", () => {
  const secret = "test_game_signing_secret_999";

  it("selects valid scratch prizes based on weighted probability", () => {
    const prize = selectWeightedScratchPrize(0.01);
    expect(prize).toBeDefined();
    expect(prize.amount).toBeGreaterThan(0);
    expect(SCRATCH_PRIZES.some((p) => p.label === prize.label)).toBe(true);
  });

  it("signs and verifies valid scratch card sessions", () => {
    const userId = "usr_scratch_123";
    const prizeIndex = 2; // 50 Tickets
    const nonce = "test_nonce_abc";

    const token = signScratchSession(userId, prizeIndex, nonce, secret);
    const decoded = verifyScratchSession(token, secret);

    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(userId);
    expect(decoded?.prizeIndex).toBe(prizeIndex);
    expect(decoded?.nonce).toBe(nonce);
  });

  it("rejects tampered scratch card session tokens", () => {
    const userId = "usr_scratch_123";
    const prizeIndex = 0; // 50 Coins
    const nonce = "test_nonce_abc";

    const token = signScratchSession(userId, prizeIndex, nonce, secret);
    const [, hmac] = token.split(".");

    // Forger tries to replace prizeIndex 0 with JACKPOT (index 5)
    const forgedPayload = Buffer.from(
      JSON.stringify({ userId, prizeIndex: 5, nonce, createdAt: Date.now() })
    ).toString("base64url");
    const tamperedToken = `${forgedPayload}.${hmac}`;

    const decoded = verifyScratchSession(tamperedToken, secret);
    expect(decoded).toBeNull();
  });

  it("evaluates provably fair coin flips deterministically", () => {
    const serverSeed = "mock_server_seed_deterministic";
    const clientSeed = "mock_client_seed_123";
    const nonce = 100;

    const outcome1 = evaluateCoinFlip(serverSeed, clientSeed, nonce);
    const outcome2 = evaluateCoinFlip(serverSeed, clientSeed, nonce);

    // Deterministic: Same seeds and nonce must always produce the identical outcome
    expect(outcome1).toBe(outcome2);
    expect(["HEADS", "TAILS"]).toContain(outcome1);
  });
});
