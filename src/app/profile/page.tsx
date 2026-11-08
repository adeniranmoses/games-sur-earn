import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/v2/Header";
import { BottomNav } from "@/components/v2/BottomNav";
import CopyButton from "@/components/CopyButton";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  Ticket,
  Flame
} from "lucide-react";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as any).id as string;

  const [userRecord, wallet, referralEarnings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        role: true,
        countryCode: true,
        referralCode: true,
        tickets: true,
        currentStreak: true,
        longestStreak: true,
        createdAt: true,
        referredBy: { select: { referralCode: true } },
        _count: { select: { referrals: true } },
      },
    }),
    prisma.wallet.findUnique({
      where: { userId },
      select: {
        availableCoins: true,
        pendingCoins: true,
        lifetimeEarnedCoins: true,
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 8,
        },
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

  if (!userRecord) redirect("/login");

  const availableCoins = wallet?.availableCoins || 0;
  const referralCount = userRecord._count.referrals;
  const referralEarningsCoins = referralEarnings._sum.coins || 0;
  const recentTxs = wallet?.transactions || [];

  const formattedJoinDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(new Date(userRecord.createdAt));

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#102A43] flex flex-col justify-between selection:bg-[#EAF3FF] selection:text-[#1769D2]">
      {/* Top Header */}
      <Header
        user={{
          name: userRecord.name,
          email: userRecord.email,
          availableCoins,
          tickets: userRecord.tickets,
        }}
        activeTab="profile"
      />

      {/* Main Container */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 pt-5 pb-24 flex flex-col gap-5">
        {/* Page Title */}
        <div className="pb-3 border-b border-[#E2E8F0]">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EAF3FF] text-[#1769D2]">
            Account & Security
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#102A43] mt-1">
            User Profile
          </h1>
          <p className="text-xs text-[#64748B]">Manage your referral code, credentials, and ledger history.</p>
        </div>

        {/* User Hero Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 shadow-xs flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-[#1769D2] text-white flex items-center justify-center font-black text-xl shadow-xs uppercase">
              {userRecord.name ? userRecord.name.slice(0, 2) : "US"}
            </div>
            <span
              className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-white border border-[#E2E8F0] shadow-xs"
              title={`Country: ${userRecord.countryCode}`}
            >
              {userRecord.countryCode === "NG" ? "🇳🇬" : userRecord.countryCode === "US" ? "🇺🇸" : "🌐"}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-bold text-[#102A43] truncate">{userRecord.name}</h2>
              <ShieldCheck className="w-4 h-4 text-[#1769D2] shrink-0" />
            </div>
            <p className="text-xs text-[#64748B] font-mono truncate">{userRecord.email}</p>
            <div className="flex items-center gap-2 mt-1.5 text-xs">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF3FF] text-[#1769D2] border border-[#BFDBFE]">
                {userRecord.role}
              </span>
              <span className="text-[#64748B] text-[11px] font-medium flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-500" /> {userRecord.currentStreak}d Streak
              </span>
            </div>
          </div>
        </div>

        {/* Account Balances Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
            <span className="text-xs text-[#64748B] font-medium block">Available Coins</span>
            <span className="text-lg font-bold text-[#102A43] block mt-1">
              {availableCoins.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-[#1769D2]">
              ≈ ${(availableCoins / 1000).toFixed(2)} USD
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
            <span className="text-xs text-[#64748B] font-medium block">Raffle Tickets</span>
            <div className="flex items-center gap-1.5 mt-1">
              <Ticket className="w-4 h-4 text-[#1769D2]" />
              <span className="text-lg font-bold text-[#102A43]">
                {userRecord.tickets.toLocaleString()}
              </span>
            </div>
            <span className="text-xs font-semibold text-emerald-600">
              Active in Raffles
            </span>
          </div>
        </div>

        {/* Referral Program Card */}
        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col gap-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EAF3FF] flex items-center justify-center font-bold text-[#1769D2]">
              <Users className="w-4 h-4 text-[#1769D2]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#102A43]">Your Referral Hub</h3>
              <p className="text-xs text-[#64748B]">
                {referralCount === 0
                  ? "Share your link to earn 10% lifetime commission"
                  : `${referralCount} ${referralCount === 1 ? "friend" : "friends"} joined`}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-[#64748B] font-semibold">Your Referral Code</span>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 rounded-xl bg-[#F5F7FA] border border-[#E2E8F0] font-mono font-bold text-[#1769D2] tracking-wider text-sm text-center">
                {userRecord.referralCode}
              </div>
              <CopyButton text={userRecord.referralCode} />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-[#E2E8F0]">
            <span className="text-[#64748B]">Referral Earnings</span>
            <span className="font-bold text-emerald-600">{referralEarningsCoins.toLocaleString()} Coins</span>
          </div>
        </div>

        {/* Security & Verification Details */}
        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col gap-3">
          <span className="text-xs font-bold text-[#102A43] uppercase tracking-wider">
            Security &amp; Account Status
          </span>

          <div className="flex items-center justify-between text-xs">
            <span className="text-[#64748B]">Email Status</span>
            {userRecord.emailVerified ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                <ShieldCheck className="w-3 h-3" /> Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                <ShieldAlert className="w-3 h-3" /> Unverified
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-[#64748B]">Member Since</span>
            <span className="text-[#102A43] font-medium">{formattedJoinDate}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-[#64748B]">Referred By</span>
            <span className="text-[#102A43] font-medium">
              {userRecord.referredBy?.referralCode ? `@${userRecord.referredBy.referralCode}` : "Direct Signup"}
            </span>
          </div>
        </div>

        {/* Activity Ledger */}
        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#102A43]">Recent Ledger Transactions</h3>
            <Link href="/withdraw" className="text-xs text-[#1769D2] hover:underline font-semibold">
              Cashouts →
            </Link>
          </div>

          {recentTxs.length === 0 ? (
            <p className="text-xs text-[#64748B] py-3 text-center">No transaction records yet.</p>
          ) : (
            <div className="flex flex-col divide-y divide-[#E2E8F0] text-xs">
              {recentTxs.map((tx: any) => {
                const isPositive =
                  tx.type === "OFFER_REWARD" ||
                  tx.type === "SURVEY_REWARD" ||
                  tx.type === "REFERRAL_REWARD" ||
                  tx.type === "ADMIN_CREDIT" ||
                  tx.type === "VIDEO_AD_REWARD";

                return (
                  <div key={tx.id} className="py-2.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="font-semibold text-[#102A43] truncate">{tx.description}</p>
                      <p className="text-[10px] text-[#64748B]">
                        {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(tx.createdAt))}
                      </p>
                    </div>
                    <span className={`font-bold shrink-0 ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                      {isPositive ? "+" : "−"}{tx.coins.toLocaleString()} Coins
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav activeTab="profile" />
    </div>
  );
}
