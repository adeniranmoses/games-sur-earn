/**
 * Mock Offer Webhook (Development / Testing Only)
 * Endpoint: POST /api/webhooks/mock-offer
 *
 * Used to manually simulate a coin credit during development without
 * needing a real provider connected. Protected by a shared secret header.
 *
 * Request body:
 *   { userId, amount, provider, externalTxId }
 *
 * Env vars:
 *   WEBHOOK_SECRET  — Optional. If set, caller must pass it as X-Webhook-Secret header or ?secret= param.
 */

import { NextRequest, NextResponse } from "next/server";
import { creditUser } from "@/lib/offerwall";

export async function POST(req: NextRequest) {
  try {
    // 1. Verify optional webhook authorization secret
    const webhookSecret = process.env.WEBHOOK_SECRET;
    const providedSecret =
      req.headers.get("x-webhook-secret") || req.nextUrl.searchParams.get("secret");

    if (webhookSecret && providedSecret !== webhookSecret) {
      return NextResponse.json({ message: "Unauthorized: Invalid webhook secret" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, amount, provider, externalTxId } = body;

    if (!userId || !amount || !provider || !externalTxId) {
      return NextResponse.json({ message: "Missing required fields: userId, amount, provider, externalTxId" }, { status: 400 });
    }

    const coins = Math.round(Number(amount));
    if (isNaN(coins) || coins <= 0) {
      return NextResponse.json({ message: "Invalid amount value" }, { status: 400 });
    }

    // 2. Atomic credit via shared utility (includes idempotency & ledger write)
    const result = await creditUser({
      userId,
      coins,
      provider,
      externalTxId,
      description: `Completed mock offer via ${provider}`,
      type: "OFFER_REWARD",
    });

    if (result.alreadyProcessed) {
      // Return 200 so the provider stops retrying
      return NextResponse.json({ message: "Already processed" }, { status: 200 });
    }

    return NextResponse.json(
      { message: "Reward processed successfully", newBalance: result.newBalance },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[MockOffer] Webhook processing error:", error.message);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
