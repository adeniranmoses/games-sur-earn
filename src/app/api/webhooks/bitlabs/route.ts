/**
 * BitLabs Postback Webhook
 * Endpoint: GET /api/webhooks/bitlabs
 *
 * Configure in BitLabs Dashboard → Your App → Settings → Callbacks:
 *   https://yoursite.com/api/webhooks/bitlabs?uid=[%USER:UID%]&val=[%VALUE:CURRENCY%]&tx_id=[%TX%]&type=[%ACTIVITY:TYPE%]&raw=[%VALUE:USD%]&hash=[Hash]
 *
 * Env vars required:
 *   BITLABS_APP_SECRET  — App Secret from BitLabs Dashboard (for HMAC-SHA1 validation)
 *   BITLABS_APP_TOKEN   — App Token from BitLabs Dashboard (for embed URL generation)
 */

import { NextRequest, NextResponse } from "next/server";
import { bitlabsAdapter } from "@/lib/providers/bitlabs";
import { creditUser, reversalUser } from "@/lib/offerwall";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    // ── 1. Verify signature + parse params via adapter ────────────────────
    // Pass req.url as rawBody so the adapter can do HMAC-SHA1 over the full URL
    const verification = await bitlabsAdapter.verifyPostback(searchParams, req.url);

    if (!verification.isValid) {
      console.warn(`[BitLabs] Rejected postback: ${verification.reason}`);
      return NextResponse.json(
        { message: `Unauthorized: ${verification.reason}` },
        { status: 401 }
      );
    }

    const event = verification.event!;

    // ── 2. SCREENOUT — acknowledge without crediting ──────────────────────
    if (event.coinsToAdd === 0) {
      console.log(`[BitLabs] SCREENOUT for userId=${event.userId} tx=${event.externalTxId}`);
      return NextResponse.json({ message: "Screenout acknowledged" }, { status: 200 });
    }

    // ── 3. RECONCILIATION — reverse coins (chargeback) ────────────────────
    if (event.isReversal) {
      const result = await reversalUser({
        userId: event.userId,
        coins: event.coinsToAdd,
        provider: event.provider,
        externalTxId: event.externalTxId,
        description: `BitLabs chargeback: ${event.offerTitle}`,
      });

      if (result.alreadyProcessed) {
        console.log(`[BitLabs] Duplicate reversal ignored: tx=${event.externalTxId}`);
      } else {
        console.log(
          `[BitLabs] Reversed ${event.coinsToAdd} coins for userId=${event.userId}. ` +
          `New balance: ${result.newBalance}`
        );
      }
      return NextResponse.json({ message: "Reversal processed" }, { status: 200 });
    }

    // ── 4. COMPLETE / START_BONUS — credit coins ──────────────────────────
    const result = await creditUser({
      userId: event.userId,
      coins: event.coinsToAdd,
      provider: event.provider,
      externalTxId: event.externalTxId,
      description: event.offerTitle ?? "BitLabs reward",
      type: "SURVEY_REWARD",
    });

    if (result.alreadyProcessed) {
      console.log(`[BitLabs] Duplicate postback ignored: tx=${event.externalTxId}`);
    } else {
      console.log(
        `[BitLabs] Credited ${event.coinsToAdd} coins to userId=${event.userId}. ` +
        `New balance: ${result.newBalance}`
      );
    }

    return NextResponse.json({ message: "Reward credited successfully" }, { status: 200 });

  } catch (error: any) {
    console.error("[BitLabs] Webhook error:", error.message);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
