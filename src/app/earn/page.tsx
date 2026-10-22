import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Silk from "@/components/Silk";
import SignOutButton from "@/components/SignOutButton";
import EarnClient from "./EarnClient";

export default async function EarnPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as any).id as string;

  const [wallet, offers] = await Promise.all([
    prisma.wallet.findUnique({
      where: { userId },
      select: { availableCoins: true },
    }),
    prisma.offer.findMany({
      where: { isActive: true },
      orderBy: { rewardCoins: "desc" },
    }),
  ]);

  const availableCoins = wallet?.availableCoins ?? 0;

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
            <Link href="/earn" className="text-white">Earn</Link>
            <Link href="/withdraw" className="hover:text-white transition-colors">Withdraw</Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs text-zinc-500">Available</span>
              <span className="font-bold text-sm text-emerald-400">
                {availableCoins.toLocaleString()} Coins
              </span>
            </div>
            <Link
              href="/withdraw"
              className="px-4 py-2 bg-indigo-500 text-white text-sm font-bold rounded-full hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/25"
            >
              Withdraw
            </Link>
            <SignOutButton />
          </div>
        </nav>

        {/* ── MAIN CONTENT ── */}
        <main className="max-w-7xl mx-auto px-6 py-10 flex flex-col gap-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-400">Offers Marketplace</p>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-1">
                Explore Available Tasks
              </h1>
              <p className="text-zinc-400 mt-1 text-sm md:text-base">
                Earn verified coins by completing mobile games, consumer surveys, app tests, and rewarded ads.
              </p>
            </div>

            {/* Conversion Banner */}
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-3 rounded-2xl shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-zinc-300 font-medium">
                Standard Rate: <strong className="text-white">1,000 Coins = $1.00 USD</strong>
              </span>
            </div>
          </div>

          {/* Interactive Client Grid */}
          <EarnClient offers={offers} userId={userId} />
        </main>
      </div>
    </Silk>
  );
}
