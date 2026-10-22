import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = (session.user as any).id as string;

    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { role: true },
    });

    if (currentUser?.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden: Admin access required." }, { status: 403 });
    }

    const body = await req.json();
    const { targetUserId, action, value, reason } = body;

    if (!targetUserId || !action) {
      return NextResponse.json({ message: "Missing required parameters." }, { status: 400 });
    }

    if (action === "SET_STATUS") {
      if (!["ACTIVE", "SUSPENDED", "BANNED"].includes(value)) {
        return NextResponse.json({ message: "Invalid status value." }, { status: 400 });
      }

      const updatedUser = await prisma.user.update({
        where: { id: targetUserId },
        data: { accountStatus: value },
      });

      await prisma.auditLog.create({
        data: {
          userId: currentUserId,
          action: `USER_STATUS_${value}`,
          details: JSON.stringify({ targetUserId, newStatus: value, reason }),
        },
      });

      return NextResponse.json({ message: `User status updated to ${value}.`, user: updatedUser });
    }

    if (action === "SET_RISK") {
      const riskScore = Math.max(0, Math.min(100, Number(value)));

      const updatedUser = await prisma.user.update({
        where: { id: targetUserId },
        data: { riskScore },
      });

      await prisma.auditLog.create({
        data: {
          userId: currentUserId,
          action: "USER_RISK_UPDATED",
          details: JSON.stringify({ targetUserId, riskScore, reason }),
        },
      });

      return NextResponse.json({ message: `User risk score updated to ${riskScore}.`, user: updatedUser });
    }

    if (action === "ADJUST_BALANCE") {
      const coinsAmount = Math.round(Number(value));
      if (!coinsAmount || coinsAmount === 0) {
        return NextResponse.json({ message: "Invalid coins adjustment amount." }, { status: 400 });
      }

      const result = await prisma.$transaction(async (tx) => {
        const wallet = await tx.wallet.findUnique({
          where: { userId: targetUserId },
        });

        if (!wallet) {
          throw new Error("Target user wallet not found.");
        }

        if (coinsAmount < 0 && wallet.availableCoins < Math.abs(coinsAmount)) {
          throw new Error("Cannot debit more than available coins.");
        }

        const isCredit = coinsAmount > 0;
        const txType = isCredit ? "ADMIN_CREDIT" : "ADMIN_DEBIT";

        const updatedWallet = await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            availableCoins: { increment: coinsAmount },
            ...(isCredit ? { lifetimeEarnedCoins: { increment: coinsAmount } } : {}),
          },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: txType,
            coins: Math.abs(coinsAmount),
            status: "APPROVED",
            description: reason || `Manual administrative ${isCredit ? "credit" : "debit"}`,
            referenceId: `ADM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          },
        });

        await tx.auditLog.create({
          data: {
            userId: currentUserId,
            action: txType,
            details: JSON.stringify({ targetUserId, coinsAmount, reason }),
          },
        });

        return updatedWallet;
      });

      return NextResponse.json({
        message: `Successfully adjusted balance by ${coinsAmount > 0 ? "+" : ""}${coinsAmount} coins.`,
        newBalance: result.availableCoins,
      });
    }

    return NextResponse.json({ message: "Unrecognized action." }, { status: 400 });
  } catch (error: any) {
    console.error("Admin user action error:", error.message);
    return NextResponse.json({ message: error.message || "Action failed." }, { status: 500 });
  }
}
