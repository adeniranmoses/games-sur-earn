import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/v2/Header";
import { BottomNav } from "@/components/v2/BottomNav";
import AdsClient from "./AdsClient";

export default async function AdsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as any).id as string;

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const [wallet, userRecord, todayWatches] = await Promise.all([
    prisma.wallet.findUnique({
      where: { userId },
      select: { availableCoins: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { tickets: true },
    }),
    prisma.dailyAdWatch.groupBy({
      by: ["tier"],
      where: {
        userId,
        watchedAt: { gte: todayStart },
      },
      _count: { tier: true },
    }),
  ]);

  const watchedMap: Record<string, number> = {};
  for (const w of todayWatches) {
    watchedMap[w.tier] = w._count.tier;
  }

  const initialTiers = [
    {
      tier: "STANDARD" as const,
      coinsPerAd: 50,
      maxPerDay: 10,
      watchedToday: watchedMap["STANDARD"] ?? 0,
      remaining: Math.max(0, 10 - (watchedMap["STANDARD"] ?? 0)),
      maxDailyCoins: 500,
    },
    {
      tier: "GOLD" as const,
      coinsPerAd: 100,
      maxPerDay: 10,
      watchedToday: watchedMap["GOLD"] ?? 0,
      remaining: Math.max(0, 10 - (watchedMap["GOLD"] ?? 0)),
      maxDailyCoins: 1000,
    },
    {
      tier: "PREMIUM" as const,
      coinsPerAd: 200,
      maxPerDay: 10,
      watchedToday: watchedMap["PREMIUM"] ?? 0,
      remaining: Math.max(0, 10 - (watchedMap["PREMIUM"] ?? 0)),
      maxDailyCoins: 2000,
    },
  ];

  const availableCoins = wallet?.availableCoins ?? 0;

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#102A43] flex flex-col justify-between selection:bg-[#EAF3FF] selection:text-[#1769D2]">
      {/* Top Header */}
      <Header
        user={{
          name: session.user.name,
          email: session.user.email,
          availableCoins,
          tickets: userRecord?.tickets ?? 0,
        }}
        activeTab="ads"
      />

      {/* Main Container */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 pt-5 pb-24 flex flex-col gap-5">
        <div className="pb-3 border-b border-[#E2E8F0]">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EAF3FF] text-[#1769D2]">
            Passive Rewards
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#102A43] mt-1">
            Watch Rewarded Ads
          </h1>
          <p className="text-xs text-[#64748B]">
            Stream short video clips to completion and earn instant wallet credits.
          </p>
        </div>

        <AdsClient initialTiers={initialTiers} />
      </main>

      {/* Bottom Navigation */}
      <BottomNav activeTab="ads" />
    </div>
  );
}
