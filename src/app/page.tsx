import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { connection } from "next/server";
import Link from "next/link";
import Silk from "@/components/Silk";
import CopyButton from "@/components/CopyButton";
import PersistentHeader from "@/components/gpt/PersistentHeader";
import QuestsBanner from "@/components/gpt/QuestsBanner";
import PartnerWalls from "@/components/gpt/PartnerWalls";
import FloatingNavigation from "@/components/gpt/FloatingNavigation";
import { UserProfileData } from "@/types/gpt";
import LandingPage from "@/components/landing/LandingPage";

// ─── Static Mock Offers for Quick Tasks ───────────────────────────────────────
const FEATURED_GAMES = [
  {
    id: "game-1",
    title: "Board Kings",
    payout: "$18.50",
    coins: 18500,
    category: "Board Game",
    time: "3-5 days",
    badge: "TOP EARNER",
    badgeColor: "bg-blue-500 text-white",
    imageSrc: "/board-kings.jpg",
    overlayColor: "from-blue-950/60 via-blue-950/80 to-[#0F1117]",
  },
  {
    id: "game-2",
    title: "Bingo Blitz",
    payout: "$24.00",
    coins: 24000,
    category: "Casual Slots",
    time: "2-4 days",
    badge: "+30% BONUS",
    badgeColor: "bg-emerald-500 text-zinc-950",
    imageSrc: "/bingo-blitz.jpg",
    overlayColor: "from-purple-950/60 via-purple-950/80 to-[#0F1117]",
  },
  {
    id: "game-3",
    title: "Mafia City: Level 15",
    payout: "$45.00",
    coins: 45000,
    category: "Strategy MMO",
    time: "7-10 days",
    badge: "HIGH PAYOUT",
    badgeColor: "bg-amber-500 text-zinc-950",
    imageSrc: "/mafia-city.jpg",
    overlayColor: "from-teal-950/60 via-teal-950/80 to-[#0F1117]",
  },
];

function fmtCoins(coins: number) {
  return coins.toLocaleString();
}

function fmtUsd(coins: number) {
  return (coins / 1000).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export default async function DashboardPage() {
  await connection();

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return <LandingPage />;
  }

  const userId = (session.user as any).id as string;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [wallet, todayResult, userInfo, referralEarnings] = await Promise.all([
    prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: { orderBy: { createdAt: "desc" }, take: 6 },
      },
    }),
    prisma.walletTransaction.aggregate({
      where: {
        wallet: { userId },
        status: "APPROVED",
        createdAt: { gte: startOfToday },
        type: { in: ["OFFER_REWARD", "SURVEY_REWARD", "REFERRAL_REWARD", "ADMIN_CREDIT"] },
      },
      _sum: { coins: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        role: true,
        referralCode: true,
        countryCode: true,
        tickets: true,
        currentStreak: true,
        longestStreak: true,
        createdAt: true,
        referredBy: { select: { referralCode: true } },
        _count: { select: { referrals: true } },
      },
    }),
    prisma.walletTransaction.aggregate({
      where: {
        wallet: { userId },
        type: "REFERRAL_REWARD",
        status: "APPROVED",
      },
      _sum: { coins: true },
    }),
  ]);

  const available = wallet?.availableCoins ?? 0;
  const pending = wallet?.pendingCoins ?? 0;
  const lifetime = wallet?.lifetimeEarnedCoins ?? 0;
  const today = todayResult._sum.coins ?? 0;
  const referralCode = userInfo?.referralCode ?? "";
  const referralCount = userInfo?._count.referrals ?? 0;
  const refEarningsCoins = referralEarnings._sum.coins ?? 0;
  const recentTxs = wallet?.transactions ?? [];

  // Construct structured user profile data for Module 2 & 5
  const profileData: UserProfileData = {
    id: userInfo?.id ?? userId,
    name: userInfo?.name ?? session.user.name ?? "Gamer",
    email: userInfo?.email ?? session.user.email ?? "",
    emailVerified: userInfo?.emailVerified ?? false,
    role: userInfo?.role ?? "USER",
    countryCode: userInfo?.countryCode ?? "US",
    referralCode,
    referredByCode: userInfo?.referredBy?.referralCode,
    referralCount,
    referralEarningsCoins: refEarningsCoins,
    createdAt: userInfo?.createdAt ? userInfo.createdAt.toISOString() : new Date().toISOString(),
    availableCoins: available,
    pendingCoins: pending,
    tickets: userInfo?.tickets ?? 0,
    currentStreak: userInfo?.currentStreak ?? 0,
    longestStreak: userInfo?.longestStreak ?? 0,
  };

  return (
    <Silk>
      <div className="min-h-screen bg-[#0F1117] text-white font-sans selection:bg-emerald-500/30 pb-28">
        
        {/* ── MODULE 5: Persistent Dual-Currency Header ── */}
        <PersistentHeader user={profileData} />

        {/* ── MAIN DASHBOARD CONTAINER ── */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-10">

          {/* ── MODULE 3: Engagement, Quests & Quests Banner ── */}
          <section id="quests">
            <QuestsBanner referralCode={referralCode} />
          </section>

          {/* ── HERO FEATURED GAMES SHOWCASE ── */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  Featured Game Offers
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Highest Multipliers
                  </span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Play verified titles and hit milestone levels for automatic cashouts.
                </p>
              </div>
              <Link
                href="/earn"
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                View All Marketplace →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURED_GAMES.map((game) => (
                <div
                  key={game.id}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 hover:border-emerald-500/50 transition-all shadow-xl flex flex-col"
                >
                  {/* Game Artwork Image (top half) */}
                  <div className="relative w-full h-44 overflow-hidden">
                    <Image
                      src={game.imageSrc}
                      alt={game.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Category & Badge overlaid on image */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60" />
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-black/50 text-white border border-white/20 backdrop-blur-sm">
                        {game.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase shadow-sm ${game.badgeColor}`}>
                        {game.badge}
                      </span>
                    </div>
                  </div>

                  {/* Card Details (bottom half with dark bg) */}
                  <div className={`bg-gradient-to-b ${game.overlayColor} p-5 flex flex-col gap-4 flex-1`}>
                    <div>
                      <h4 className="text-lg font-black text-white group-hover:text-emerald-300 transition-colors">
                        {game.title}
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5">Est. completion: {game.time}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-black text-white tracking-tight">
                          {game.payout}
                        </span>
                        <span className="text-xs text-zinc-400 block -mt-1">
                          +{fmtCoins(game.coins)} Coins
                        </span>
                      </div>

                      <Link
                        href="/earn"
                        className="px-5 py-2.5 rounded-full bg-white hover:bg-emerald-400 text-zinc-950 font-black text-xs transition-all shadow-lg active:scale-95"
                      >
                        Start Game
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── MODULE 4: Survey & Offer Wall Partner Cards ── */}
          <section id="partners">
            <PartnerWalls />
          </section>

          {/* ── TWO COLUMN: REFERRALS & RECENT LEDGER ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Referral Hub Card */}
            <div className="p-6 rounded-3xl bg-zinc-900/60 border border-white/10 flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-400">
                  🎁
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Your Referral Network</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {referralCount === 0
                      ? "No referrals yet — share your link!"
                      : `${referralCount} ${referralCount === 1 ? "friend" : "friends"} registered`}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] text-zinc-400 font-semibold">Your Referral Code</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 font-mono font-bold text-emerald-400 tracking-widest text-sm text-center">
                    {referralCode}
                  </div>
                  <CopyButton text={referralCode} />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-xs text-zinc-400 leading-relaxed">
                Earn <strong>10% lifetime commissions</strong> on every offer or survey completed by users who join using your code.
              </div>
            </div>

            {/* Recent Activity Ledger (2/3 width) */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-zinc-900/60 border border-white/10 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-white">Live Ledger Audit Feed</h3>
                  <p className="text-xs text-zinc-400">Real-time server transaction confirmation</p>
                </div>
                <Link
                  href="/withdraw"
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-bold transition-colors"
                >
                  View Cashout Records →
                </Link>
              </div>

              {recentTxs.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-xs">
                  No previous transactions recorded yet. Complete an offer on the Earn tab to start your ledger!
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-white/5 text-xs">
                  {recentTxs.map((tx) => {
                    const isPositive =
                      tx.type === "OFFER_REWARD" ||
                      tx.type === "SURVEY_REWARD" ||
                      tx.type === "REFERRAL_REWARD" ||
                      tx.type === "ADMIN_CREDIT";

                    return (
                      <div
                        key={tx.id}
                        className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs ${
                              isPositive
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {isPositive ? "+" : "−"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate">{tx.description}</p>
                            <p className="text-[11px] text-zinc-500">{formatDate(tx.createdAt)}</p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`font-black text-sm ${
                              isPositive ? "text-emerald-400" : "text-red-400"
                            }`}
                          >
                            {isPositive ? "+" : "−"}{fmtCoins(tx.coins)} Coins
                          </span>
                          <span className="text-[10px] text-zinc-500 block">
                            {fmtUsd(tx.coins)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </main>

        {/* ── MODULE 6: Mobile-First Floating Navigation Bar ── */}
        <FloatingNavigation />

      </div>
    </Silk>
  );
}
