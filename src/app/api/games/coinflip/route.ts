import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";
import { assertNoVpn } from "@/lib/fraud";
import { evaluateCoinFlip } from "@/lib/games";
import crypto from "crypto";

const MAX_FREE_FLIPS_PER_DAY = 5;
const FREE_FLIP_REWARD = 25; // 25 coins on win

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

  const freeFlipsUsed = await prisma.walletTransaction.count({
    where: {
      wallet: { userId },
      type: "OFFER_REWARD",
      referenceId: { startsWith: `COINFLIP-FREE-${userId}-` },
      createdAt: { gte: todayStart },
    },
  });

  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    select: { availableCoins: true },
  });

  return NextResponse.json({
    availableCoins: wallet?.availableCoins ?? 0,
    freeFlipsMax: MAX_FREE_FLIPS_PER_DAY,
    freeFlipsUsed,
    freeFlipsRemaining: Math.max(0, MAX_FREE_FLIPS_PER_DAY - freeFlipsUsed),
    freeFlipReward: FREE_FLIP_REWARD,
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Please log in to play." }, { status: 401 });
    }

    const userId = (session.user as any).id as string;

    // Fraud protection
    const vpnCheck = await assertNoVpn(req, "coinflip-game");
    if (!vpnCheck.allowed) {
      return vpnCheck.errorResponse!;
    }

    // Rate limit
    const limit = rateLimit(`coinflip:${userId}`, 30, 60 * 1000);
    if (!limit.success) {
      return rateLimitExceededResponse(limit);
    }

    const body = await req.json().catch(() => ({}));
    const { choice, wager = 0, isFree = false } = body;

    if (!choice || !["HEADS", "TAILS"].includes(choice)) {
      return NextResponse.json({ message: "Please choose HEADS or TAILS." }, { status: 400 });
    }

    const wagerAmount = Math.max(0, Math.floor(Number(wager)));
    const todayStart = getTodayStartUTC();

    // Provably fair generation
    const serverSeed = crypto.randomBytes(32).toString("hex");
    const serverHash = crypto.createHash("sha256").update(serverSeed).digest("hex");
    const clientSeed = crypto.randomBytes(16).toString("hex");
    const nonce = Date.now();

    const outcome = evaluateCoinFlip(serverSeed, clientSeed, nonce);
    const isWin = outcome === choice;

    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new Error("Wallet not found.");

      if (isFree) {
        // Handle daily free flip
        const freeCount = await tx.walletTransaction.count({
          where: {
            wallet: { userId },
            type: "OFFER_REWARD",
            referenceId: { startsWith: `COINFLIP-FREE-${userId}-` },
            createdAt: { gte: todayStart },
          },
        });

        if (freeCount >= MAX_FREE_FLIPS_PER_DAY) {
          throw new Error("Daily free coin flips exhausted. Try wagering standard coins!");
        }

        const coinsEarned = isWin ? FREE_FLIP_REWARD : 0;
        let newBalance = wallet.availableCoins;

        if (coinsEarned > 0) {
          const updated = await tx.wallet.update({
            where: { id: wallet.id },
            data: {
              availableCoins: { increment: coinsEarned },
              lifetimeEarnedCoins: { increment: coinsEarned },
            },
          });
          newBalance = updated.availableCoins;
        }

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: "OFFER_REWARD",
            coins: coinsEarned,
            status: "APPROVED",
            description: `Free Coin Flip: ${isWin ? `Won +${coinsEarned} Coins` : "Missed"} (${choice} vs ${outcome})`,
            provider: "arcade_coinflip",
            referenceId: `COINFLIP-FREE-${userId}-${nonce}`,
          },
        });

        return {
          won: isWin,
          outcome,
          coinsDelta: coinsEarned,
          newBalance,
          freeFlipsRemaining: Math.max(0, MAX_FREE_FLIPS_PER_DAY - (freeCount + 1)),
        };
      } else {
        // Standard Wager Mode (50 to 1,000 Coins)
        if (wagerAmount < 25 || wagerAmount > 2000) {
          throw new Error("Wager must be between 25 and 2,000 Coins.");
        }

        if (wallet.availableCoins < wagerAmount) {
          throw new Error("Insufficient balance for this wager.");
        }

        // Deduct wager
        let newBalance = wallet.availableCoins - wagerAmount;
        const profit = isWin ? Math.floor(wagerAmount * 0.95) : -wagerAmount; // 1.95x multiplier
        const payout = isWin ? wagerAmount + profit : 0;

        if (isWin) {
          const updated = await tx.wallet.update({
            where: { id: wallet.id },
            data: {
              availableCoins: { increment: profit },
              lifetimeEarnedCoins: { increment: profit },
            },
          });
          newBalance = updated.availableCoins;
        } else {
          const updated = await tx.wallet.update({
            where: { id: wallet.id },
            data: {
              availableCoins: { decrement: wagerAmount },
            },
          });
          newBalance = updated.availableCoins;
        }

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: isWin ? "OFFER_REWARD" : "ADMIN_DEBIT",
            coins: Math.abs(profit),
            status: "APPROVED",
            description: isWin
              ? `Coin Flip Wager (${wagerAmount} Coins): Won +${profit} Coins net profit (${choice} vs ${outcome})`
              : `Coin Flip Wager (${wagerAmount} Coins): Lost (${choice} vs ${outcome})`,
            provider: "arcade_coinflip",
            referenceId: `COINFLIP-WAGER-${userId}-${nonce}`,
          },
        });

        return {
          won: isWin,
          outcome,
          coinsDelta: profit,
          newBalance,
          freeFlipsRemaining: 0,
        };
      }
    });

    return NextResponse.json({
      success: true,
      won: result.won,
      outcome: result.outcome,
      choice,
      coinsDelta: result.coinsDelta,
      newBalance: result.newBalance,
      freeFlipsRemaining: result.freeFlipsRemaining,
      provablyFair: {
        serverHash,
        clientSeed,
        nonce,
      },
      message: result.won
        ? `🎉 Great call! You chose ${choice} and it landed on ${result.outcome} (+${result.coinsDelta} Coins)!`
        : `💨 Hard luck! You chose ${choice} but it landed on ${result.outcome}.`,
    });
  } catch (err: any) {
    console.error("[CoinFlip] Error:", err.message);
    return NextResponse.json(
      { message: err.message || "An unexpected error occurred." },
      { status: 400 }
    );
  }
}
