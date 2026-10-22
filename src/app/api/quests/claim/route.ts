import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Please log in to claim quest rewards." }, { status: 401 });
    }

    const userId = (session.user as any).id as string;

    // Security: Max 15 quest claim calls per minute per user to prevent scripted rapid-fire exploits
    const limit = rateLimit(`quest_claim:${userId}`, 15, 60 * 1000);
    if (!limit.success) {
      return rateLimitExceededResponse(limit);
    }
    const body = await req.json();
    const { questId } = body;

    if (!questId) {
      return NextResponse.json({ message: "Quest ID is required." }, { status: 400 });
    }

    const quest = await prisma.quest.findUnique({
      where: { id: questId },
    });

    if (!quest || !quest.isActive) {
      return NextResponse.json({ message: "Quest not found or no longer active." }, { status: 404 });
    }

    // Atomic claim execution
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: { wallet: true },
      });

      if (!user) {
        throw new Error("User not found.");
      }

      const now = new Date();

      // ── Handle Daily Streak (Recurring) ──
      if (quest.isRecurring) {
        if (user.lastStreakClaimedAt) {
          const msSinceLast = now.getTime() - new Date(user.lastStreakClaimedAt).getTime();
          const hoursSinceLast = msSinceLast / (1000 * 60 * 60);

          if (hoursSinceLast < 24) {
            const hoursLeft = Math.ceil(24 - hoursSinceLast);
            throw new Error(`Daily streak already claimed today! Check back in ${hoursLeft}h.`);
          }

          // If within 48h -> streak continues; if > 48h -> streak broke, restart at 1
          let nextStreak = hoursSinceLast <= 48 ? user.currentStreak + 1 : 1;
          const nextLongest = Math.max(user.longestStreak, nextStreak);

          // Credit coins to user's wallet
          let newAvailableCoins = user.wallet?.availableCoins ?? 0;
          if (user.wallet) {
            const updatedWallet = await tx.wallet.update({
              where: { id: user.wallet.id },
              data: {
                availableCoins: { increment: quest.rewardAmount },
                lifetimeEarnedCoins: { increment: quest.rewardAmount },
              },
            });
            newAvailableCoins = updatedWallet.availableCoins;

            // Record transaction in ledger
            await tx.walletTransaction.create({
              data: {
                walletId: user.wallet.id,
                type: "OFFER_REWARD",
                coins: quest.rewardAmount,
                status: "APPROVED",
                description: `Daily Streak Check-in Day ${nextStreak}`,
                referenceId: `STRK-${user.id}-${Date.now()}`,
              },
            });
          }

          // Update user streak & record claim
          const updatedUser = await tx.user.update({
            where: { id: userId },
            data: {
              currentStreak: nextStreak,
              longestStreak: nextLongest,
              lastStreakClaimedAt: now,
            },
          });

          await tx.userQuest.create({
            data: {
              userId,
              questId: quest.id,
              rewardGranted: quest.rewardAmount,
              rewardType: quest.rewardType,
            },
          });

          return {
            updatedUser,
            newAvailableCoins,
            rewardType: quest.rewardType,
            rewardGranted: quest.rewardAmount,
            message: `🔥 Streak Day ${nextStreak} claimed! +${quest.rewardAmount} Coins added to your wallet!`,
          };
        } else {
          // First time claiming streak ever
          let newAvailableCoins = user.wallet?.availableCoins ?? 0;
          if (user.wallet) {
            const updatedWallet = await tx.wallet.update({
              where: { id: user.wallet.id },
              data: {
                availableCoins: { increment: quest.rewardAmount },
                lifetimeEarnedCoins: { increment: quest.rewardAmount },
              },
            });
            newAvailableCoins = updatedWallet.availableCoins;

            await tx.walletTransaction.create({
              data: {
                walletId: user.wallet.id,
                type: "OFFER_REWARD",
                coins: quest.rewardAmount,
                status: "APPROVED",
                description: "Daily Streak Check-in Day 1",
                referenceId: `STRK-${user.id}-${Date.now()}`,
              },
            });
          }

          const updatedUser = await tx.user.update({
            where: { id: userId },
            data: {
              currentStreak: 1,
              longestStreak: Math.max(user.longestStreak, 1),
              lastStreakClaimedAt: now,
            },
          });

          await tx.userQuest.create({
            data: {
              userId,
              questId: quest.id,
              rewardGranted: quest.rewardAmount,
              rewardType: quest.rewardType,
            },
          });

          return {
            updatedUser,
            newAvailableCoins,
            rewardType: quest.rewardType,
            rewardGranted: quest.rewardAmount,
            message: `🔥 Daily Streak started! +${quest.rewardAmount} Coins added to your wallet!`,
          };
        }
      }

      // ── Handle One-Time Quests (Social / System) ──
      const alreadyClaimed = await tx.userQuest.findFirst({
        where: { userId, questId: quest.id },
      });

      if (alreadyClaimed) {
        throw new Error("You have already completed and claimed this quest.");
      }

      // If quest grants Tickets
      let updatedUser = user;
      if (quest.rewardType === "TICKETS") {
        updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            tickets: { increment: quest.rewardAmount },
          },
          include: { wallet: true },
        });
      }

      // If quest grants Coins
      let newAvailableCoins = user.wallet?.availableCoins ?? 0;
      if (quest.rewardType === "COINS" && user.wallet) {
        const updatedWallet = await tx.wallet.update({
          where: { id: user.wallet.id },
          data: {
            availableCoins: { increment: quest.rewardAmount },
            lifetimeEarnedCoins: { increment: quest.rewardAmount },
          },
        });
        newAvailableCoins = updatedWallet.availableCoins;

        await tx.walletTransaction.create({
          data: {
            walletId: user.wallet.id,
            type: "OFFER_REWARD",
            coins: quest.rewardAmount,
            status: "APPROVED",
            description: `Completed Quest: ${quest.title}`,
            referenceId: `QST-${user.id}-${Date.now()}`,
          },
        });
      }

      // Record completion
      await tx.userQuest.create({
        data: {
          userId,
          questId: quest.id,
          rewardGranted: quest.rewardAmount,
          rewardType: quest.rewardType,
        },
      });

      return {
        updatedUser,
        newAvailableCoins,
        rewardType: quest.rewardType,
        rewardGranted: quest.rewardAmount,
        message: `🎉 Quest completed! +${quest.rewardDisplay} credited to your profile!`,
      };
    });

    return NextResponse.json({
      message: result.message,
      newTickets: result.updatedUser.tickets,
      currentStreak: result.updatedUser.currentStreak,
      newAvailableCoins: result.newAvailableCoins,
    });
  } catch (error: any) {
    console.error("Quest claim error:", error.message);
    return NextResponse.json({ message: error.message || "Failed to claim quest." }, { status: 400 });
  }
}
