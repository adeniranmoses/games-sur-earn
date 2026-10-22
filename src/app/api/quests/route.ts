import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;

    // 1. Fetch all active quests
    const quests = await prisma.quest.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    // If guest / unauthenticated
    if (!userId) {
      return NextResponse.json({
        quests: quests.map((q) => ({
          ...q,
          completed: false,
          canClaim: false,
        })),
        userTickets: 0,
        currentStreak: 0,
        streakCanClaim: false,
      });
    }

    // 2. Fetch user's completion records & streak data
    const [user, completions] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          tickets: true,
          currentStreak: true,
          longestStreak: true,
          lastStreakClaimedAt: true,
        },
      }),
      prisma.userQuest.findMany({
        where: { userId },
        select: { questId: true, claimedAt: true },
      }),
    ]);

    const completedQuestIds = new Set(completions.map((c) => c.questId));

    // Calculate streak status
    const now = new Date();
    let streakCanClaim = true;
    let hoursUntilNextStreak = 0;

    if (user?.lastStreakClaimedAt) {
      const msSinceLastClaim = now.getTime() - new Date(user.lastStreakClaimedAt).getTime();
      const hoursSinceLastClaim = msSinceLastClaim / (1000 * 60 * 60);

      if (hoursSinceLastClaim < 24) {
        streakCanClaim = false;
        hoursUntilNextStreak = Math.ceil(24 - hoursSinceLastClaim);
      }
    }

    // Format response
    const formattedQuests = quests.map((q) => {
      let isCompleted = completedQuestIds.has(q.id);
      let canClaim = !isCompleted;

      // For recurring daily streak
      if (q.isRecurring) {
        isCompleted = !streakCanClaim;
        canClaim = streakCanClaim;
      }

      return {
        id: q.id,
        slug: q.slug,
        title: q.title,
        description: q.description,
        category: q.category,
        rewardType: q.rewardType,
        rewardAmount: q.rewardAmount,
        rewardDisplay: q.rewardDisplay,
        actionLabel: q.actionLabel,
        actionUrl: q.actionUrl,
        iconName: q.iconName,
        isRecurring: q.isRecurring,
        completed: isCompleted,
        canClaim,
        hoursUntilNextStreak: q.isRecurring ? hoursUntilNextStreak : 0,
      };
    });

    return NextResponse.json({
      quests: formattedQuests,
      userTickets: user?.tickets ?? 0,
      currentStreak: user?.currentStreak ?? 0,
      longestStreak: user?.longestStreak ?? 0,
      streakCanClaim,
      hoursUntilNextStreak,
    });
  } catch (error: any) {
    console.error("Error fetching quests:", error);
    return NextResponse.json({ message: "Failed to load quests." }, { status: 500 });
  }
}
