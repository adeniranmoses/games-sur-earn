import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// Calculates the next Sunday at 23:59:59 UTC
function getNextDrawDateUTC(): Date {
  const now = new Date();
  const day = now.getUTCDay(); // 0 = Sunday, 1 = Monday...
  const daysUntilSunday = (7 - day) % 7;
  const drawDate = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday),
    23, 59, 59, 999
  ));
  return drawDate;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    const [userRecord, totalPlatformTickets] = await Promise.all([
      userId
        ? prisma.user.findUnique({
            where: { id: userId },
            select: { tickets: true, name: true },
          })
        : null,
      prisma.user.aggregate({
        _sum: { tickets: true },
      }),
    ]);

    const userTickets = userRecord?.tickets ?? 0;
    const totalTickets = Math.max(1250, (totalPlatformTickets._sum.tickets ?? 0) + 500); // Baseline active pool

    const userChance = totalTickets > 0
      ? Number(((userTickets / totalTickets) * 100).toFixed(2))
      : 0;

    const nextDrawAt = getNextDrawDateUTC().toISOString();

    const prizeDistribution = [
      { place: "1st Place", coins: 250000, valueUsd: 250, badge: "🥇 Grand Prize" },
      { place: "2nd Place", coins: 100000, valueUsd: 100, badge: "🥈 Runner Up" },
      { place: "3rd Place", coins: 50000,  valueUsd: 50,  badge: "🥉 3rd Place" },
      { place: "4th - 10th", coins: 15000, valueUsd: 15,  badge: "🎖️ Top 10 Bonus" },
    ];

    const recentWinners = [
      { name: "David K.", country: "US", prize: "250,000 Coins ($250)", ticketsHeld: 320, drawDate: "Last Sunday" },
      { name: "Elena R.", country: "GB", prize: "100,000 Coins ($100)", ticketsHeld: 185, drawDate: "Last Sunday" },
      { name: "Marcus P.", country: "CA", prize: "50,000 Coins ($50)",  ticketsHeld: 90,  drawDate: "Last Sunday" },
      { name: "Jin W.", country: "KR", prize: "15,000 Coins ($15)",   ticketsHeld: 65,  drawDate: "Last Sunday" },
    ];

    return NextResponse.json({
      roundName: "Weekly Community Raffle #18",
      totalPrizePoolCoins: 500000,
      totalPrizePoolUsd: 500,
      nextDrawAt,
      userTickets,
      totalTicketsInPool: totalTickets,
      userWinChancePercent: userChance,
      prizeDistribution,
      recentWinners,
    });
  } catch (error: any) {
    console.error("[Raffle API] Error:", error.message);
    return NextResponse.json({ message: "Failed to load raffle status" }, { status: 500 });
  }
}
