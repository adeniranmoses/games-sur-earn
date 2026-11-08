import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { UserProfileData } from "@/types/gpt";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;

  try {
    const [userRecord, wallet, referralEarnings] = await Promise.all([
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
      prisma.wallet.findUnique({
        where: { userId },
        select: {
          availableCoins: true,
          pendingCoins: true,
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

    if (!userRecord) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const profileData: UserProfileData = {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      emailVerified: userRecord.emailVerified,
      role: userRecord.role,
      countryCode: userRecord.countryCode,
      referralCode: userRecord.referralCode,
      referredByCode: userRecord.referredBy?.referralCode || null,
      referralCount: userRecord._count.referrals,
      referralEarningsCoins: referralEarnings._sum.coins || 0,
      createdAt: userRecord.createdAt.toISOString(),
      availableCoins: wallet?.availableCoins || 0,
      pendingCoins: wallet?.pendingCoins || 0,
      tickets: userRecord.tickets,
      currentStreak: userRecord.currentStreak,
      longestStreak: userRecord.longestStreak,
    };

    return NextResponse.json({ user: profileData });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
