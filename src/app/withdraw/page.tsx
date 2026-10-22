import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Silk from "@/components/Silk";
import SignOutButton from "@/components/SignOutButton";
import WithdrawClient from "./WithdrawClient";

export default async function WithdrawPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as any).id as string;

  const [wallet, products, redemptions] = await Promise.all([
    prisma.wallet.findUnique({
      where: { userId },
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
    <Silk>
      <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-indigo-500/30">
        {/* ── NAVBAR ── */}
        <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-zinc-950/80 backdrop-blur-md border-b border-white/10">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold shadow-lg shadow-indigo-500/20">
                R
              </div>
              <span className="font-bold text-xl tracking-tight">RewardPlatform</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/earn" className="hover:text-white transition-colors">Earn</Link>
            <Link href="/withdraw" className="text-white">Withdraw</Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs text-zinc-500">Available</span>
              <span className="font-bold text-sm text-emerald-400">
                {availableCoins.toLocaleString()} Coins
              </span>
            </div>
            <SignOutButton />
          </div>
        </nav>

        {/* ── MAIN CONTENT ── */}
        <main className="max-w-7xl mx-auto px-6 py-10 flex flex-col gap-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-400">Rewards Catalogue</p>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-1">
                Redeem Your Earnings
              </h1>
              <p className="text-zinc-400 mt-1 text-sm md:text-base">
                Exchange your verified coins for global digital gift cards or instant cryptocurrency payouts.
              </p>
            </div>

            {/* Quick Balance Summary Card */}
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl shrink-0">
              <div>
                <span className="text-xs text-zinc-400 block">Available Balance</span>
                <span className="text-xl font-bold text-emerald-400">
                  {availableCoins.toLocaleString()} Coins
                </span>
                <span className="text-xs text-zinc-500 block">
                  ≈ ${(availableCoins / 1000).toFixed(2)} USD
                </span>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <span className="text-xs text-zinc-400 block">Reserved Holds</span>
                <span className="text-xl font-bold text-orange-400">
                  {reservedCoins.toLocaleString()} Coins
                </span>
                <span className="text-xs text-zinc-500 block">In processing</span>
              </div>
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
      </div>
    </Silk>
  );
}
