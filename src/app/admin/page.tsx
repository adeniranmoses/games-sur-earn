import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const userId = (session.user as any).id as string;

  // Verify fresh admin role from the database
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, name: true, email: true },
  });

  if (currentUser?.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-[#0A0C10] text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-3xl bg-zinc-900/60 border border-rose-500/30 text-center flex flex-col items-center gap-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center text-2xl font-black">
            ✕
          </div>
          <h1 className="text-2xl font-black tracking-tight">Access Restricted</h1>
          <p className="text-zinc-400 text-xs leading-relaxed">
            Your account (<strong className="text-zinc-200">{currentUser?.email}</strong>) does not hold administrative clearance.
          </p>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-[11px] text-zinc-400 w-full text-left">
            💡 If you are the system owner, grant admin status locally using:
            <code className="block mt-1 font-mono text-amber-300">
              node scripts/make-admin.js {currentUser?.email}
            </code>
          </div>
          <Link
            href="/"
            className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Fetch Aggregated Operations Metrics & Initial Queues
  const [
    totalUsers,
    activeUsers,
    bannedUsers,
    walletAggregates,
    pendingRedemptionsAgg,
    rawRedemptions,
    rawUsers,
    rawAuditLogs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { accountStatus: "ACTIVE" } }),
    prisma.user.count({ where: { accountStatus: "BANNED" } }),
    prisma.wallet.aggregate({
      _sum: {
        availableCoins: true,
        reservedCoins: true,
      },
    }),
    prisma.redemptionRequest.aggregate({
      where: { status: "PENDING" },
      _count: { id: true },
      _sum: { coinsSpent: true },
    }),
    prisma.redemptionRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            countryCode: true,
            riskScore: true,
          },
        },
        product: {
          select: {
            title: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        wallet: {
          select: {
            availableCoins: true,
            pendingCoins: true,
            reservedCoins: true,
            lifetimeEarnedCoins: true,
          },
        },
        _count: {
          select: {
            redemptions: true,
            referrals: true,
          },
        },
      },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    }),
  ]);

  const stats = {
    totalUsers,
    activeUsers,
    bannedUsers,
    totalAvailableCoins: walletAggregates._sum.availableCoins ?? 0,
    totalReservedCoins: walletAggregates._sum.reservedCoins ?? 0,
    pendingRedemptionsCount: pendingRedemptionsAgg._count.id ?? 0,
    pendingRedemptionsCoins: pendingRedemptionsAgg._sum.coinsSpent ?? 0,
  };

  const initialRedemptions = rawRedemptions.map((r) => ({
    id: r.id,
    userId: r.userId,
    userName: r.user.name,
    userEmail: r.user.email,
    userCountry: r.user.countryCode,
    userRiskScore: r.user.riskScore,
    coinsSpent: r.coinsSpent,
    displayCurrency: r.displayCurrency,
    rewardValue: Number(r.rewardValue),
    payoutMethod: r.payoutMethod,
    payoutAddress: r.payoutAddress,
    status: r.status,
    adminNotes: r.adminNotes,
    providerTxId: r.providerTxId,
    productTitle: r.product?.title ?? null,
    createdAt: r.createdAt.toISOString(),
  }));

  const initialUsers = rawUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    countryCode: u.countryCode,
    accountStatus: u.accountStatus,
    riskScore: u.riskScore,
    referralCode: u.referralCode,
    createdAt: u.createdAt.toISOString(),
    wallet: u.wallet,
    redemptionsCount: u._count.redemptions,
    referralsCount: u._count.referrals,
  }));

  const initialAuditLogs = rawAuditLogs.map((log) => ({
    id: log.id,
    action: log.action,
    adminEmail: log.user?.email ?? null,
    details: log.details,
    createdAt: log.createdAt.toISOString(),
  }));

  return (
    <AdminClient
      stats={stats}
      initialRedemptions={initialRedemptions}
      initialUsers={initialUsers}
      initialAuditLogs={initialAuditLogs}
    />
  );
}
