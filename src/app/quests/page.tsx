import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/v2/Header";
import { BottomNav } from "@/components/v2/BottomNav";
import QuestsClient from "./QuestsClient";

export default async function QuestsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as any).id as string;

  const [wallet, userRecord] = await Promise.all([
    prisma.wallet.findUnique({
      where: { userId },
      select: { availableCoins: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        tickets: true,
        currentStreak: true,
        longestStreak: true,
        referralCode: true,
      },
    }),
  ]);

  if (!userRecord) redirect("/login");

  const availableCoins = wallet?.availableCoins || 0;

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#102A43] flex flex-col justify-between selection:bg-[#EAF3FF] selection:text-[#1769D2]">
      {/* Top Header */}
      <Header
        user={{
          name: session.user.name,
          email: session.user.email,
          availableCoins,
          tickets: userRecord.tickets,
        }}
        activeTab="quests"
      />

      {/* Main Container */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 pt-5 pb-24 flex flex-col gap-5">
        <div className="pb-3 border-b border-[#E2E8F0]">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EAF3FF] text-[#1769D2]">
            Daily Streaks &amp; Challenges
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#102A43] mt-1">
            Quests &amp; Community Raffles
          </h1>
          <p className="text-xs text-[#64748B]">Complete tasks to boost your streak, earn raffle tickets, and unlock bonuses.</p>
        </div>

        <QuestsClient
          referralCode={userRecord.referralCode}
          initialTickets={userRecord.tickets}
          initialStreak={userRecord.currentStreak}
        />
      </main>

      {/* Bottom Navigation */}
      <BottomNav activeTab="quests" />
    </div>
  );
}
