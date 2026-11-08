import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { validateBitLabsSignature, validateCpxSignature } from "../offerwall";
import { bitlabsAdapter } from "../providers/bitlabs";

describe("Offerwall Postback & Signature Verification Protocols", () => {
  const bitlabsSecret = "bitlabs_secret_test_key_888";
  const cpxAppKey = "cpx_secret_app_key_555";

  // ── 1. BitLabs HMAC-SHA1 ──────────────────────────────────────────────────
  it("successfully validates authentic BitLabs HMAC-SHA1 signatures", () => {
    const rawUrlWithoutHash = "https://example.com/api/webhooks/bitlabs?uid=usr_123&val=1000&tx_id=tx_999&type=COMPLETE&raw=1.00";
    const expectedHash = crypto
      .createHmac("sha1", bitlabsSecret)
      .update(rawUrlWithoutHash)
      .digest("hex");

    const fullUrl = `${rawUrlWithoutHash}&hash=${expectedHash}`;
    const isValid = validateBitLabsSignature(fullUrl, bitlabsSecret);

    expect(isValid).toBe(true);
  });

  it("rejects forged or tampered BitLabs postbacks", () => {
    const rawUrlWithoutHash = "https://example.com/api/webhooks/bitlabs?uid=usr_123&val=1000&tx_id=tx_999&type=COMPLETE&raw=1.00";
    const validHash = crypto
      .createHmac("sha1", bitlabsSecret)
      .update(rawUrlWithoutHash)
      .digest("hex");

    // Attacker modifies val from 1000 to 50000 coins without changing hash
    const tamperedUrl = `https://example.com/api/webhooks/bitlabs?uid=usr_123&val=50000&tx_id=tx_999&type=COMPLETE&raw=1.00&hash=${validHash}`;
    const isValid = validateBitLabsSignature(tamperedUrl, bitlabsSecret);

    expect(isValid).toBe(false);
  });

  // ── 2. CPX Research MD5 ───────────────────────────────────────────────────
  it("accurately verifies genuine CPX Research postback signatures", () => {
    const transId = "cpx_tx_777888";
    const expectedHash = crypto
      .createHash("md5")
      .update(`${transId}-${cpxAppKey}`)
      .digest("hex");

    const isValid = validateCpxSignature(transId, expectedHash, cpxAppKey);
    expect(isValid).toBe(true);
  });

  it("rejects tampered CPX Research postback signatures", () => {
    const transId = "cpx_tx_777888";
    const forgedHash = "00000000000000000000000000000000";

    const isValid = validateCpxSignature(transId, forgedHash, cpxAppKey);
    expect(isValid).toBe(false);
  });

  // ── 3. BitLabs Adapter Event Parsing ─────────────────────────────────────
  it("properly handles SCREENOUT postbacks with 0 coins reward", async () => {
    const params = new URLSearchParams({
      uid: "usr_abc",
      val: "0",
      tx_id: "tx_screenout_1",
      type: "SCREENOUT",
    });

    const res = await bitlabsAdapter.verifyPostback(params);
    expect(res.isValid).toBe(true);
    expect(res.event?.coinsToAdd).toBe(0);
    expect(res.event?.isReversal).toBe(false);
  });

  it("properly parses RECONCILIATION as chargeback reversal", async () => {
    const rawUrl = "https://example.com/api/webhooks/bitlabs?uid=usr_abc&val=500&tx_id=tx_reversal_1&type=RECONCILIATION";
    const secret = process.env.BITLABS_APP_SECRET || bitlabsSecret;
    const hash = crypto.createHmac("sha1", secret).update(rawUrl).digest("hex");
    const fullUrl = `${rawUrl}&hash=${hash}`;

    const params = new URLSearchParams({
      uid: "usr_abc",
      val: "500",
      tx_id: "tx_reversal_1",
      type: "RECONCILIATION",
      hash,
    });

    const res = await bitlabsAdapter.verifyPostback(params, fullUrl);
    expect(res.isValid).toBe(true);
    expect(res.event?.coinsToAdd).toBe(500);
    expect(res.event?.isReversal).toBe(true);
  });
});
