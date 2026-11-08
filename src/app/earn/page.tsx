import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/v2/Header";
import { BottomNav } from "@/components/v2/BottomNav";
import EarnClient from "./EarnClient";

export default async function EarnPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as any).id as string;
  const isAdmin = (session.user as any).role === "ADMIN";

  const [wallet, userRecord, offers] = await Promise.all([
    prisma.wallet.findUnique({
      where: { userId },
      select: { availableCoins: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { tickets: true },
    }),
    prisma.offer.findMany({
      where: { isActive: true },
      orderBy: { rewardCoins: "desc" },
    }),
  ]);

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
        activeTab="earn"
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 pt-5 pb-24 flex flex-col gap-5">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EAF3FF] text-[#1769D2]">
                Offers Marketplace
              </span>
              <span className="text-xs text-[#64748B]">Complete tasks &amp; play games</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#102A43] mt-1">
              Explore Available Tasks
            </h1>
          </div>

          {/* Conversion Banner */}
          <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] px-3 py-1.5 rounded-xl shrink-0 self-start sm:self-auto shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-[#64748B] font-medium">
              Rate: <strong className="text-[#102A43]">1,000 Coins = $1.00 USD</strong>
            </span>
          </div>
        </div>

        {/* Interactive Client Grid */}
        <EarnClient offers={offers} userId={userId} isAdmin={isAdmin} />
      </main>

      {/* Bottom Sticky Nav */}
      <BottomNav activeTab="earn" />
    </div>
  );
}
