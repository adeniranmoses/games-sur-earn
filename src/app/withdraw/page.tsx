import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/v2/Header";
import { BottomNav } from "@/components/v2/BottomNav";
import WithdrawClient from "./WithdrawClient";

export default async function WithdrawPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as any).id as string;

  const [wallet, userRecord, products, redemptions] = await Promise.all([
    prisma.wallet.findUnique({
      where: { userId },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { tickets: true },
    }),
    prisma.giftCardProduct.findMany({
      where: { isActive: true },
      orderBy: { coinsCost: "asc" },
    }),
    prisma.redemptionRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const availableCoins = wallet?.availableCoins ?? 0;
  const reservedCoins = wallet?.reservedCoins ?? 0;

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
        activeTab="withdraw"
      />

      {/* Main Container */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 pt-5 pb-24">
        {/* Title Header */}
        <div className="mb-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#1769D2] bg-[#EAF3FF] px-2.5 py-1 rounded-full">
            Rewards Payouts
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-[#102A43] mt-2">
            Redeem Your Earnings
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Exchange your verified coins for cryptocurrency, digital vouchers, or bank transfers.
          </p>
        </div>

        {/* Quick Balance Summary Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-xs mb-6 grid grid-cols-2 gap-3 divide-x divide-[#E2E8F0]">
          <div>
            <span className="text-[11px] font-medium text-[#64748B] block">Available</span>
            <span className="text-lg font-bold text-[#102A43] block mt-0.5">
              {availableCoins.toLocaleString()} Coins
            </span>
            <span className="text-[11px] font-semibold text-[#1769D2] block mt-0.5">
              ≈ ${(availableCoins / 1000).toFixed(2)} USD
            </span>
          </div>
          <div className="pl-3">
            <span className="text-[11px] font-medium text-[#64748B] block">Processing</span>
            <span className="text-lg font-bold text-amber-600 block mt-0.5">
              {reservedCoins.toLocaleString()} Coins
            </span>
            <span className="text-[11px] text-[#64748B] block mt-0.5">In queue</span>
          </div>
        </div>

        {/* Interactive Client Component */}
        <WithdrawClient
          initialAvailableCoins={availableCoins}
          products={products.map((p) => ({
            ...p,
            faceValue: Number(p.faceValue),
          }))}
          redemptions={redemptions.map((r) => ({
            ...r,
            rewardValue: Number(r.rewardValue),
            createdAt: r.createdAt.toISOString(),
          }))}
        />
      </main>

      {/* Bottom Sticky Nav */}
      <BottomNav activeTab="withdraw" />
    </div>
  );
}
