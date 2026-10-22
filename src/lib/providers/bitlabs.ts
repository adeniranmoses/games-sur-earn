import crypto from "crypto";
import { OfferwallProviderAdapter, VerificationResult } from "./types";

/**
 * BitLabs Offerwall Provider Adapter
 *
 * Handles:
 *  - Generating the survey wall launch URL (iframe/redirect)
 *  - Validating incoming postback signatures (HMAC-SHA1 of full URL)
 *
 * Env vars:
 *   BITLABS_APP_TOKEN   — App Token from BitLabs Dashboard (used in launch URL)
 *   BITLABS_APP_SECRET  — App Secret from BitLabs Dashboard (used for HMAC-SHA1 signature validation)
 *
 * Official postback format:
 *   GET ?uid={userId}&val={coins}&tx_id={txId}&type={COMPLETE|SCREENOUT|RECONCILIATION|START_BONUS}&raw={usdPayout}&hash={hmac-sha1}
 *
 * Official hash algorithm:
 *   HMAC-SHA1(fullUrlWithoutHashParam, BITLABS_APP_SECRET) → hex
 */
export class BitLabsAdapter implements OfferwallProviderAdapter {
  id = "bitlabs";
  name = "BitLabs";
  type = "SURVEY" as const;

  private appToken: string;
  private appSecret: string;

  constructor() {
    this.appToken = process.env.BITLABS_APP_TOKEN ?? "";
    this.appSecret = process.env.BITLABS_APP_SECRET ?? "";
  }

  /**
   * Returns the BitLabs survey wall URL for embedding.
   * In sandbox mode (no token set), returns a local placeholder URL.
   */
  generateLaunchUrl(userId: string, _userCountry?: string): string {
    if (!this.appToken) {
      // Dev sandbox: local placeholder so UI doesn't break
      return `/earn?sandbox=bitlabs&uid=${encodeURIComponent(userId)}`;
    }
    const params = new URLSearchParams({ token: this.appToken, uid: userId });
    return `https://web.bitlabs.ai/?${params.toString()}`;
  }

  /**
   * Validates a BitLabs postback using HMAC-SHA1 over the full URL.
   *
   * BitLabs docs: sign everything in the URL BEFORE &hash=
   * The raw URL must be used exactly as received — no encoding/decoding.
   *
   * @param params   - URLSearchParams from req.nextUrl.searchParams
   * @param rawBody  - Full request URL string (req.url) for signature verification
   */
  async verifyPostback(
    params: URLSearchParams | Record<string, any>,
    rawBody?: string // we use rawBody as the full URL string
  ): Promise<VerificationResult> {
    const get = (key: string): string | null => {
      if (params instanceof URLSearchParams) return params.get(key);
      return params[key] ?? null;
    };

    const uid   = get("uid");
    const val   = get("val");
    const tx_id = get("tx_id");
    const type  = get("type");   // COMPLETE | SCREENOUT | RECONCILIATION | START_BONUS
    const hash  = get("hash");

    // ── 1. Validate required parameters ──────────────────────────────────
    if (!uid || !tx_id || val === null || !type) {
      return { isValid: false, reason: "Missing required parameters: uid, val, tx_id, type" };
    }

    // ── 2. SCREENOUT — valid postback but no reward ───────────────────────
    if (type === "SCREENOUT") {
      return {
        isValid: true,
        event: {
          userId: uid,
          coinsToAdd: 0,
          externalTxId: tx_id,
          provider: this.id,
          offerTitle: "BitLabs Survey Screenout",
          isReversal: false,
          rawPayload: params,
        },
      };
    }

    // ── 3. HMAC-SHA1 Signature Verification ──────────────────────────────
    // rawBody must be the full request URL (req.url)
    if (this.appSecret && rawBody && hash) {
      const hashIndex = rawBody.indexOf("&hash=");
      if (hashIndex === -1) {
        return { isValid: false, reason: "No &hash= parameter found in URL" };
      }

      const urlWithoutHash = rawBody.substring(0, hashIndex);
      const expectedHash = crypto
        .createHmac("sha1", this.appSecret)
        .update(urlWithoutHash)
        .digest("hex");

      try {
        const signaturesMatch = crypto.timingSafeEqual(
          Buffer.from(expectedHash, "hex"),
          Buffer.from(hash, "hex")
        );
        if (!signaturesMatch) {
          return { isValid: false, reason: "HMAC-SHA1 signature mismatch" };
        }
      } catch {
        return { isValid: false, reason: "Invalid hash format" };
      }
    } else if (this.appSecret && !hash) {
      return { isValid: false, reason: "Missing hash parameter" };
    }
    // If appSecret is not configured (dev mode), skip signature check

    // ── 4. Parse coin value ───────────────────────────────────────────────
    // BitLabs `val` is already in your virtual currency (coins) if configured
    // correctly in the dashboard. Raw USD is in `raw` param, not `val`.
    const rawAmount = parseFloat(val);
    if (isNaN(rawAmount)) {
      return { isValid: false, reason: `Invalid val parameter: "${val}"` };
    }

    // If val looks like a small USD amount (< 10), convert to coins (× 1000)
    // If val is already coins (≥ 10), use as-is
    const coinsToAdd = Math.round(rawAmount >= 10 ? rawAmount : rawAmount * 1000);
    const isReversal = type === "RECONCILIATION";

    return {
      isValid: true,
      event: {
        userId: uid,
        coinsToAdd: Math.abs(coinsToAdd),
        externalTxId: tx_id,
        provider: this.id,
        offerTitle: `BitLabs Survey (${type})`,
        isReversal,
        rawPayload: params,
      },
    };
  }
}

export const bitlabsAdapter = new BitLabsAdapter();
