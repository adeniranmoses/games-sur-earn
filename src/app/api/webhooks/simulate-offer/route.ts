/**
 * Simulate Offer Completion (Dev/Test Only)
 * POST /api/webhooks/simulate-offer
 *
 * A thin authenticated server-side proxy that calls the internal mock-offer
 * webhook. The webhook secret never touches the client bundle.
 *
 * Request body: { offerId, amount, provider }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { creditUser } from "@/lib/offerwall";
import { rateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Only authenticated users can trigger a simulation
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized: Please log in." }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    // In production, simulation endpoints are restricted strictly to administrators
    if (process.env.NODE_ENV === "production" && userRole !== "ADMIN") {
      return NextResponse.json(
        { message: "Forbidden: Task simulation is disabled for regular accounts in production." },
        { status: 403 }
      );
    }

    const userId = (session.user as any).id as string;

    // Rate limit: max 10 simulations per minute per user
    const limit = rateLimit(`simulate_offer:${userId}`, 10, 60 * 1000);
    if (!limit.success) {
      return rateLimitExceededResponse(limit);
    }

    const body = await req.json();
    const { offerId, amount, provider } = body;

    if (!offerId || !amount || !provider) {
      return NextResponse.json(
        { message: "Missing required fields: offerId, amount, provider" },
        { status: 400 }
      );
    }

    const coins = Math.round(Number(amount));
    if (isNaN(coins) || coins <= 0 || coins > 100_000) {
      return NextResponse.json({ message: "Invalid amount value" }, { status: 400 });
    }

    // Credit the authenticated session user (not a user-supplied userId)
    const externalTxId = `sim-${offerId}-${userId}-${Date.now()}`;
    const result = await creditUser({
      userId,
      coins,
      provider,
      externalTxId,
      description: `Completed mock offer via ${provider} (simulation)`,
      type: "OFFER_REWARD",
    });

    if (result.alreadyProcessed) {
      return NextResponse.json({ message: "Already processed" }, { status: 200 });
    }

    return NextResponse.json(
      { message: "Reward processed successfully", newBalance: result.newBalance },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[SimulateOffer] Error:", error.message);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
