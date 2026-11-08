import { describe, it, expect } from "vitest";
import crypto from "crypto";

const AD_TIERS = {
  STANDARD: { coinsPerAd: 50, duration: 15 },
  GOLD:     { coinsPerAd: 100, duration: 20 },
  PREMIUM:  { coinsPerAd: 200, duration: 30 },
} as const;

function signSessionToken(userId: string, tier: string, startedAt: number, nonce: string, secret: string): string {
  const data = `${userId}:${tier}:${startedAt}:${nonce}`;
  const hmac = crypto.createHmac("sha256", secret).update(data).digest("hex");
  const payload = Buffer.from(JSON.stringify({ userId, tier, startedAt, nonce })).toString("base64url");
  return `${payload}.${hmac}`;
}

function verifySessionToken(token: string, secret: string) {
  try {
    const [payloadB64, receivedHmac] = token.split(".");
    if (!payloadB64 || !receivedHmac) return null;

    const payloadStr = Buffer.from(payloadB64, "base64url").toString("utf8");
    const parsed = JSON.parse(payloadStr);
    const { userId, tier, startedAt, nonce } = parsed;

    const expectedData = `${userId}:${tier}:${startedAt}:${nonce}`;
    const expectedHmac = crypto.createHmac("sha256", secret).update(expectedData).digest("hex");

    const valid = crypto.timingSafeEqual(
      Buffer.from(receivedHmac, "hex"),
      Buffer.from(expectedHmac, "hex")
    );

    return valid ? { userId, tier, startedAt, nonce } : null;
  } catch {
    return null;
  }
}

describe("Rewarded Video Ads Security Protocols", () => {
  const secret = "test_signing_secret_999";

  it("successfully signs and verifies legitimate ad session tokens", () => {
    const userId = "usr_123";
    const tier = "PREMIUM";
    const startedAt = Date.now();
    const nonce = crypto.randomBytes(16).toString("hex");

    const token = signSessionToken(userId, tier, startedAt, nonce, secret);
    const verified = verifySessionToken(token, secret);

    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(userId);
    expect(verified?.tier).toBe(tier);
    expect(verified?.nonce).toBe(nonce);
  });

  it("rejects forged or tampered session tokens", () => {
    const userId = "usr_123";
    const tier = "STANDARD";
    const startedAt = Date.now();
    const nonce = crypto.randomBytes(16).toString("hex");

    const token = signSessionToken(userId, tier, startedAt, nonce, secret);

    // Tamper with payload to claim PREMIUM reward instead of STANDARD
    const [, hmac] = token.split(".");
    const tamperedPayload = Buffer.from(
      JSON.stringify({ userId, tier: "PREMIUM", startedAt, nonce })
    ).toString("base64url");
    const forgedToken = `${tamperedPayload}.${hmac}`;

    const verified = verifySessionToken(forgedToken, secret);
    expect(verified).toBeNull();
  });

  it("detects premature claims before video duration finishes", () => {
    const duration = AD_TIERS.PREMIUM.duration; // 30s
    const startedAt = Date.now() - 5000; // only 5 seconds elapsed
    const elapsedMs = Date.now() - startedAt;
    const minRequiredMs = (duration - 2) * 1000; // 28s

    const isFinished = elapsedMs >= minRequiredMs;
    expect(isFinished).toBe(false);
  });
});
