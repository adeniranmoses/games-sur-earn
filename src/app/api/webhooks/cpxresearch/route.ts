/**
 * CPX Research Postback Webhook
 * Endpoint: GET /api/webhooks/cpxresearch
 *
 * Configure this URL in your CPX Research Publisher Dashboard → Postback Settings:
 *   https://yoursite.com/api/webhooks/cpxresearch?user_id={user_id}&trans_id={trans_id}&status={status}&reward={amount_local}&hash={secure_hash}
 *
 * Parameters received:
 *   user_id   — Your platform's userId (passed when embedding the survey widget)
 *   trans_id  — CPX unique transaction ID (used for idempotency)
 *   status    — "1" = Completed & credited | "2" = Cancelled/Reversed (chargeback)
 *   reward    — Coins to credit (amount_local — use your local virtual currency rate)
 *   hash      — MD5 hash of: MD5(trans_id + "-" + CPX_APP_KEY)
 *
 * Security:
 *   - MD5 hash validated before ANY database operation
 *   - status=2 fires a reversal (chargeback deduction)
 *   - Duplicate trans_id + provider combinations silently acknowledged (200)
 *
 * Env vars required:
 *   CPX_APP_KEY  — Found in CPX Research Dashboard → Your App → Security Key
 */

import { NextRequest, NextResponse } from "next/server";
import {
  validateCpxSignature,
  creditUser,
  reversalUser,
} from "@/lib/offerwall";

export async function GET(req: NextRequest) {
  try {
    const appKey = process.env.CPX_APP_KEY;

    // ── 1. Check config ────────────────────────────────────────────────────
    if (!appKey) {
      console.error("[CPX Research] CPX_APP_KEY env var is not set.");
      return NextResponse.json({ message: "Server misconfiguration" }, { status: 500 });
    }

    // ── 2. Extract Parameters ──────────────────────────────────────────────
    const { searchParams } = req.nextUrl;
    const userId  = searchParams.get("user_id");
    const transId = searchParams.get("trans_id");
    const status  = searchParams.get("status");  // "1" = complete, "2" = reversal
    const reward  = searchParams.get("reward");  // coins (amount_local)
    const hash    = searchParams.get("hash");

    if (!userId || !transId || !status || !reward || !hash) {
      return NextResponse.json({ message: "Missing required parameters" }, { status: 400 });
    }

    // ── 3. Signature Validation ────────────────────────────────────────────
    const isValid = validateCpxSignature(transId, hash, appKey);

    if (!isValid) {
      console.warn(`[CPX Research] Invalid hash for trans_id=${transId}. Received hash: ${hash}`);
      return NextResponse.json({ message: "Unauthorized: Invalid signature" }, { status: 401 });
    }

    const coins = Math.round(Number(reward));
    if (isNaN(coins) || coins <= 0) {
      return NextResponse.json({ message: "Invalid reward amount" }, { status: 400 });
    }

    // ── 4. Route by Status ─────────────────────────────────────────────────
    // status=1: Survey completed — credit coins
    if (status === "1") {
      const result = await creditUser({
        userId,
        coins,
        provider: "cpxresearch",
        externalTxId: transId,
        description: `CPX Research survey completed (trans_id: ${transId})`,
        type: "SURVEY_REWARD",
      });

      if (result.alreadyProcessed) {
        console.log(`[CPX Research] Duplicate postback ignored: trans_id=${transId}`);
        return NextResponse.json({ message: "Already processed" }, { status: 200 });
      }

      console.log(
        `[CPX Research] Credited ${coins} coins to userId=${userId} (trans_id=${transId}). New balance: ${result.newBalance}`
      );
      return NextResponse.json({ message: "Reward credited successfully" }, { status: 200 });
    }

    // status=2: Reversal / chargeback — deduct coins
    if (status === "2") {
      const result = await reversalUser({
        userId,
        coins,
        provider: "cpxresearch",
        externalTxId: transId,
        description: `CPX Research chargeback/reversal (trans_id: ${transId})`,
      });

      if (result.alreadyProcessed) {
        console.log(`[CPX Research] Duplicate reversal ignored: trans_id=${transId}`);
        return NextResponse.json({ message: "Already processed" }, { status: 200 });
      }

      console.log(
        `[CPX Research] Reversal of ${coins} coins for userId=${userId} (trans_id=${transId}). New balance: ${result.newBalance}`
      );
      return NextResponse.json({ message: "Reversal processed" }, { status: 200 });
    }

    // Unknown status — acknowledge to avoid retries
    console.warn(`[CPX Research] Unknown status="${status}" for user=${userId} trans_id=${transId}`);
    return NextResponse.json({ message: `Unknown status: ${status}` }, { status: 200 });

  } catch (error: any) {
    console.error("[CPX Research] Webhook error:", error.message);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
