/**
 * Lucky Spin Arcade Game API
 * GET  /api/games/spin — Returns remaining daily spins
 * POST /api/games/spin — Executes a server-validated spin, calculates prize, credits ledger
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";
import { assertNoVpn } from "@/lib/fraud";
import { MAX_SPINS_PER_DAY, selectWeightedPrize } from "@/lib/games";

function getTodayStartUTC(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const todayStart = getTodayStartUTC();

  const count = await prisma.walletTransaction.count({
    where: {
      wallet: { userId },
      type: "OFFER_REWARD",
      referenceId: { startsWith: `SPIN-${userId}-` },
      createdAt: { gte: todayStart },
    },
  });

  const remaining = Math.max(0, MAX_SPINS_PER_DAY - count);

  return NextResponse.json({
    maxSpins: MAX_SPINS_PER_DAY,
    usedSpins: count,
    remainingSpins: remaining,
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Please log in to spin." }, { status: 401 });
    }

    const userId = (session.user as any).id as string;

    // Fraud protection: no VPN/Proxy
    const vpnCheck = await assertNoVpn(req, "lucky-spin");
    if (!vpnCheck.allowed) {
      return vpnCheck.errorResponse!;
    }

    // Rate limit: max 6 spin requests per minute
    const limit = rateLimit(`lucky_spin:${userId}`, 6, 60 * 1000);
    if (!limit.success) {
      return rateLimitExceededResponse(limit);
    }

    const todayStart = getTodayStartUTC();

    // Atomic transaction: verify remaining spins, pick prize, credit wallet
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: { wallet: true },
      });

      if (!user || !user.wallet) {
        throw new Error("User wallet not found.");
      }

      const usedCount = await tx.walletTransaction.count({
        where: {
          walletId: user.wallet.id,
          type: "OFFER_REWARD",
          referenceId: { startsWith: `SPIN-${userId}-` },
          createdAt: { gte: todayStart },
        },
      });

      if (usedCount >= MAX_SPINS_PER_DAY) {
        throw new Error(
          `You have used all ${MAX_SPINS_PER_DAY} free spins for today. Daily limit resets at midnight 00:00 UTC.`
        );
      }

      // Pick weighted prize
      const { index: selectedIdx, prize } = selectWeightedPrize();

      let newCoins = user.wallet.availableCoins;
      let newTickets = user.tickets;

      if (prize.rewardType === "COINS") {
        const updatedWallet = await tx.wallet.update({
          where: { id: user.wallet.id },
          data: {
            availableCoins: { increment: prize.amount },
            lifetimeEarnedCoins: { increment: prize.amount },
          },
        });
        newCoins = updatedWallet.availableCoins;
      } else {
        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: {
            tickets: { increment: prize.amount },
          },
        });
        newTickets = updatedUser.tickets;
      }

      // Record transaction ledger row
      await tx.walletTransaction.create({
        data: {
          walletId: user.wallet.id,
          type: "OFFER_REWARD",
          coins: prize.rewardType === "COINS" ? prize.amount : 0,
          status: "APPROVED",
          description: `Lucky Arcade Spin: ${prize.label}`,
          referenceId: `SPIN-${userId}-${Date.now()}`,
        },
      });

      const remaining = MAX_SPINS_PER_DAY - (usedCount + 1);

      return {
        selectedIdx,
        prize,
        remainingSpins: remaining,
        newCoins,
        newTickets,
      };
    }, {
      maxWait: 15000,
      timeout: 30000,
    });

    return NextResponse.json({
      success: true,
      selectedIdx: result.selectedIdx,
      label: result.prize.label,
      rewardType: result.prize.rewardType,
      amount: result.prize.amount,
      remainingSpins: result.remainingSpins,
      newCoins: result.newCoins,
      newTickets: result.newTickets,
      message: `🎉 You won ${result.prize.label}!`,
    });
  } catch (error: any) {
    if (error.message?.includes("free spins for today")) {
      return NextResponse.json({ message: error.message }, { status: 429 });
    }
    return NextResponse.json(
      { message: error.message || "Failed to execute arcade spin." },
      { status: 500 }
    );
  }
}
