import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";
import { assertNoVpn } from "@/lib/fraud";
import {
  MAX_SCRATCHES_PER_DAY,
  SCRATCH_PRIZES,
  selectWeightedScratchPrize,
  signScratchSession,
  verifyScratchSession,
} from "@/lib/games";
import crypto from "crypto";

function getTodayStartUTC(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function getSecret(): string {
  return process.env.NEXTAUTH_SECRET || "fallback_scratch_secret_123456";
}

// In-memory set to prevent nonce reuse in claim
const usedScratchNonces = new Set<string>();

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
      referenceId: { startsWith: `SCRATCH-${userId}-` },
      createdAt: { gte: todayStart },
    },
  });

  const remaining = Math.max(0, MAX_SCRATCHES_PER_DAY - count);

  return NextResponse.json({
    maxScratches: MAX_SCRATCHES_PER_DAY,
    usedScratches: count,
    remainingScratches: remaining,
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Please log in to play." }, { status: 401 });
    }

    const userId = (session.user as any).id as string;

    // Fraud protection: no VPN/Proxy
    const vpnCheck = await assertNoVpn(req, "scratch-game");
    if (!vpnCheck.allowed) {
      return vpnCheck.errorResponse!;
    }

    // Rate limit: 20 per minute
    const limit = rateLimit(`scratch:${userId}`, 20, 60 * 1000);
    if (!limit.success) {
      return rateLimitExceededResponse(limit);
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || "start";
    const secret = getSecret();
    const todayStart = getTodayStartUTC();

    if (action === "start") {
      // Check remaining daily scratches
      const count = await prisma.walletTransaction.count({
        where: {
          wallet: { userId },
          type: "OFFER_REWARD",
          referenceId: { startsWith: `SCRATCH-${userId}-` },
          createdAt: { gte: todayStart },
        },
      });

      if (count >= MAX_SCRATCHES_PER_DAY) {
        return NextResponse.json(
          {
            success: false,
            message: `You've used all ${MAX_SCRATCHES_PER_DAY} daily scratch cards! Check back tomorrow.`,
            remainingScratches: 0,
          },
          { status: 429 }
        );
      }

      const prize = selectWeightedScratchPrize();
      const prizeIndex = SCRATCH_PRIZES.findIndex((p) => p.label === prize.label);
      const nonce = crypto.randomBytes(12).toString("hex");
      const sessionToken = signScratchSession(userId, prizeIndex, nonce, secret);

      return NextResponse.json({
        success: true,
        sessionToken,
        prize: {
          label: prize.label,
          rewardType: prize.rewardType,
          amount: prize.amount,
          symbol: prize.symbol,
        },
        remainingScratches: MAX_SCRATCHES_PER_DAY - count,
      });
    }

    if (action === "claim") {
      const { sessionToken, scratchedRatio = 0 } = body;
      if (!sessionToken) {
        return NextResponse.json({ message: "Missing session token." }, { status: 400 });
      }

      const decoded = verifyScratchSession(sessionToken, secret);
      if (!decoded || decoded.userId !== userId) {
        return NextResponse.json({ message: "Invalid or forged scratch ticket." }, { status: 403 });
      }

      if (scratchedRatio < 0.4) {
        return NextResponse.json({ message: "Card not fully scratched yet!" }, { status: 400 });
      }

      if (usedScratchNonces.has(decoded.nonce)) {
        return NextResponse.json({ message: "This scratch card has already been claimed." }, { status: 409 });
      }
      usedScratchNonces.add(decoded.nonce);

      const prize = SCRATCH_PRIZES[decoded.prizeIndex] || SCRATCH_PRIZES[0];
      const referenceId = `SCRATCH-${userId}-${decoded.nonce}`;

      const txResult = await prisma.$transaction(
        async (tx) => {
          // Idempotency check: verify referenceId hasn't already been credited in the ledger
          const existingClaim = await tx.walletTransaction.findUnique({
            where: { referenceId },
          });
          if (existingClaim) {
            throw new Error("This scratch card has already been claimed.");
          }

          // Re-check daily cap inside transaction to prevent race conditions
          const count = await tx.walletTransaction.count({
            where: {
              wallet: { userId },
              type: "OFFER_REWARD",
              referenceId: { startsWith: `SCRATCH-${userId}-` },
              createdAt: { gte: todayStart },
            },
          });

          if (count >= MAX_SCRATCHES_PER_DAY) {
            throw new Error("Daily scratch limit reached.");
          }

          const wallet = await tx.wallet.findUnique({ where: { userId } });
          if (!wallet) throw new Error("Wallet not found.");

          let newCoins = wallet.availableCoins;
          let newTickets = 0;

          if (prize.rewardType === "COINS") {
            const updatedWallet = await tx.wallet.update({
              where: { id: wallet.id },
              data: {
                availableCoins: { increment: prize.amount },
                lifetimeEarnedCoins: { increment: prize.amount },
              },
            });
            newCoins = updatedWallet.availableCoins;

            await tx.walletTransaction.create({
              data: {
                walletId: wallet.id,
                type: "OFFER_REWARD",
                coins: prize.amount,
                status: "APPROVED",
                description: `Scratch & Win: Won ${prize.label}`,
                provider: "scratch_arcade",
                referenceId,
              },
            });
          } else {
            // Tickets
            const user = await tx.user.update({
              where: { id: userId },
              data: { tickets: { increment: prize.amount } },
            });
            newTickets = user.tickets;

            await tx.walletTransaction.create({
              data: {
                walletId: wallet.id,
                type: "OFFER_REWARD",
                coins: 0,
                status: "APPROVED",
                description: `Scratch & Win: Won ${prize.label}`,
                provider: "scratch_arcade",
                referenceId,
              },
            });
          }

          const finalCount = count + 1;
          const remaining = Math.max(0, MAX_SCRATCHES_PER_DAY - finalCount);

          return {
            newCoins,
            newTickets,
            remainingScratches: remaining,
          };
        },
        { timeout: 15000 }
      );

      return NextResponse.json({
        success: true,
        prize: {
          label: prize.label,
          rewardType: prize.rewardType,
          amount: prize.amount,
          symbol: prize.symbol,
        },
        newCoins: txResult.newCoins,
        newTickets: txResult.newTickets,
        remainingScratches: txResult.remainingScratches,
        message: `🎉 You scratched and won ${prize.label}!`,
      });
    }

    return NextResponse.json({ message: "Invalid action." }, { status: 400 });
  } catch (err: any) {
    console.error("[ScratchGame] Error:", err.message);
    return NextResponse.json(
      { message: err.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
