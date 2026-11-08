/**
 * GET /api/notifications
 *
 * Returns the 8 most recent wallet transactions formatted as
 * notification items for the bell dropdown in the header.
 * No new DB table needed — reuses the existing WalletTransaction ledger.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// Maps TransactionType → display metadata
const TYPE_META: Record<string, { icon: string; label: string; positive: boolean }> = {
  OFFER_REWARD:        { icon: "🎮", label: "Offer Completed",       positive: true  },
  SURVEY_REWARD:       { icon: "📋", label: "Survey Completed",      positive: true  },
  REFERRAL_REWARD:     { icon: "👥", label: "Referral Commission",   positive: true  },
  VIDEO_AD_REWARD:     { icon: "📺", label: "Ad Reward",             positive: true  },
  WITHDRAWAL_RESERVE:  { icon: "💳", label: "Withdrawal Requested",  positive: false },
  WITHDRAWAL_PAID:     { icon: "✅", label: "Payout Sent",           positive: false },
  WITHDRAWAL_REFUND:   { icon: "↩️",  label: "Coins Refunded",       positive: true  },
  ADMIN_CREDIT:        { icon: "⚡", label: "Bonus Credit",          positive: true  },
  ADMIN_DEBIT:         { icon: "⚠️", label: "Admin Adjustment",      positive: false },
  REVERSAL:            { icon: "🔄", label: "Coins Reversed",        positive: false },
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id as string;

    const transactions = await prisma.walletTransaction.findMany({
      where: { wallet: { userId } },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        type: true,
        coins: true,
        description: true,
        createdAt: true,
      },
    });

    const notifications = transactions.map((tx) => {
      const meta = TYPE_META[tx.type] ?? { icon: "💰", label: tx.type, positive: true };
      return {
        id: tx.id,
        icon: meta.icon,
        label: meta.label,
        description: tx.description,
        coins: tx.coins,
        positive: meta.positive,
        createdAt: tx.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ notifications });
  } catch (error: any) {
    console.error("[Notifications] Error:", error.message);
    return NextResponse.json({ message: "Failed to load notifications." }, { status: 500 });
  }
}
