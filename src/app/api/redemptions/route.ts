import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized: Please log in." }, { status: 401 });
    }

    const userId = (session.user as any).id as string;

    // Rate limit: Max 5 redemption requests per 10 minutes per user
    const limit = rateLimit(`redemption:${userId}`, 5, 10 * 60 * 1000);
    if (!limit.success) {
      return rateLimitExceededResponse(limit);
    }
    const body = await req.json();
    const { productId, payoutMethod, payoutAddress } = body;

    if (!payoutMethod || !payoutAddress) {
      return NextResponse.json(
        { message: "Payout method and payout address (or recipient email) are required." },
        { status: 400 }
      );
    }

    // 1. Fetch user & product information
    let coinsNeeded = 0;
    let rewardValue = 0;
    let displayCurrency = "USD";
    let productTitle = "";

    if (productId) {
      const product = await prisma.giftCardProduct.findUnique({
        where: { id: productId },
      });
      if (!product || !product.isActive) {
        return NextResponse.json({ message: "Selected reward is not currently available." }, { status: 404 });
      }
      coinsNeeded = product.coinsCost;
      rewardValue = Number(product.faceValue);
      displayCurrency = product.currency;
      productTitle = product.title;
    } else {
      // Direct crypto or custom withdrawal minimum (e.g. 1000 Coins = $1.00 minimum)
      const requestedCoins = Number(body.coins);
      if (!requestedCoins || requestedCoins < 1000) {
        return NextResponse.json({ message: "Minimum redemption is 1,000 Coins ($1.00 USD)." }, { status: 400 });
      }
      coinsNeeded = Math.round(requestedCoins);
      rewardValue = coinsNeeded / 1000;
      displayCurrency = "USD";
      productTitle = `${payoutMethod} Redemption ($${rewardValue.toFixed(2)})`;
    }

    // 2. Perform Atomic Reservation
    // We deduct availableCoins, add to reservedCoins, and create ledger entry in one single transaction!
    const result = await prisma.$transaction(async (tx) => {
      // Lock and fetch current wallet
      const wallet = await tx.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw new Error("Wallet not found.");
      }

      if (wallet.availableCoins < coinsNeeded) {
        throw new Error("Insufficient balance: You do not have enough coins.");
      }

      // Step A: Reserve the coins (decrease available, increase reserved)
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          availableCoins: { decrement: coinsNeeded },
          reservedCoins: { increment: coinsNeeded },
        },
      });

      // Step B: Record the ledger audit trail
      const ledgerEntry = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "WITHDRAWAL_RESERVE",
          coins: coinsNeeded,
          status: "PENDING",
          description: `Redemption requested: ${productTitle} to ${payoutAddress}`,
          referenceId: `RED-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        },
      });

      // Step C: Create the redemption order
      const redemption = await tx.redemptionRequest.create({
        data: {
          userId,
          productId: productId || null,
          coinsSpent: coinsNeeded,
          displayCurrency,
          rewardValue,
          payoutMethod,
          payoutAddress,
          status: "PENDING",
        },
      });

      return { updatedWallet, redemption, ledgerEntry };
    });

    return NextResponse.json(
      {
        message: "Redemption requested successfully! Your coins are reserved while processing.",
        redemptionId: result.redemption.id,
        newAvailableCoins: result.updatedWallet.availableCoins,
        reservedCoins: result.updatedWallet.reservedCoins,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Redemption error:", error.message);
    if (error.message.includes("Insufficient balance")) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: error.message || "Failed to process redemption." }, { status: 500 });
  }
}
