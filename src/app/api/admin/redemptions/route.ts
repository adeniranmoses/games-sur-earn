import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = (session.user as any).id as string;

    // Verify admin role directly against database to ensure freshness
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { role: true },
    });

    if (currentUser?.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden: Admin access required." }, { status: 403 });
    }

    const body = await req.json();
    const { redemptionId, action, adminNotes, providerTxId } = body;

    if (!redemptionId || !action || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        { message: "Invalid parameters. action must be 'APPROVE' or 'REJECT'." },
        { status: 400 }
      );
    }

    // Process the redemption update atomically
    const result = await prisma.$transaction(async (tx) => {
      const redemption = await tx.redemptionRequest.findUnique({
        where: { id: redemptionId },
        include: { user: { include: { wallet: true } } },
      });

      if (!redemption) {
        throw new Error("Redemption request not found.");
      }

      if (redemption.status !== "PENDING" && redemption.status !== "PROCESSING") {
        throw new Error(`Cannot process redemption with current status: ${redemption.status}`);
      }

      const wallet = redemption.user.wallet;
      if (!wallet) {
        throw new Error("User wallet not found.");
      }

      const coinsSpent = redemption.coinsSpent;

      if (action === "APPROVE") {
        // Step 1: Decrement reserved coins from wallet
        const updatedWallet = await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            reservedCoins: { decrement: coinsSpent },
          },
        });

        // Step 2: Mark redemption request as COMPLETED
        const updatedRedemption = await tx.redemptionRequest.update({
          where: { id: redemptionId },
          data: {
            status: "COMPLETED",
            adminNotes: adminNotes || "Fulfilled by administrator",
            providerTxId: providerTxId || null,
          },
        });

        // Step 3: Record fulfillment ledger row
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: "WITHDRAWAL_PAID",
            coins: coinsSpent,
            status: "PAID",
            description: `Payout fulfilled: ${redemption.payoutMethod} (${redemption.displayCurrency} ${redemption.rewardValue}) to ${redemption.payoutAddress}`,
            externalTxId: providerTxId || null,
            referenceId: `FULFILL-${redemption.id}-${Date.now()}`,
          },
        });

        // Step 4: Audit log
        await tx.auditLog.create({
          data: {
            userId: currentUserId,
            action: "WITHDRAWAL_APPROVED",
            details: JSON.stringify({
              targetUserId: redemption.userId,
              redemptionId: redemption.id,
              coinsSpent,
              payoutMethod: redemption.payoutMethod,
              providerTxId: providerTxId || null,
              notes: adminNotes,
            }),
          },
        });

        return { updatedRedemption, updatedWallet, action: "APPROVED" };
      } else {
        // action === "REJECT" (Refunds coins back to user)
        // Step 1: Refund coins (decrement reserved, increment available)
        const updatedWallet = await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            reservedCoins: { decrement: coinsSpent },
            availableCoins: { increment: coinsSpent },
          },
        });

        // Step 2: Mark redemption request as REFUNDED
        const updatedRedemption = await tx.redemptionRequest.update({
          where: { id: redemptionId },
          data: {
            status: "REFUNDED",
            adminNotes: adminNotes || "Rejected by administrator. Coins refunded.",
          },
        });

        // Step 3: Record refund ledger row
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: "WITHDRAWAL_REFUND",
            coins: coinsSpent,
            status: "APPROVED",
            description: `Payout rejected & refunded: ${adminNotes || "Administrative rejection"}`,
            referenceId: `REFUND-${redemption.id}-${Date.now()}`,
          },
        });

        // Step 4: Audit log
        await tx.auditLog.create({
          data: {
            userId: currentUserId,
            action: "WITHDRAWAL_REJECTED",
            details: JSON.stringify({
              targetUserId: redemption.userId,
              redemptionId: redemption.id,
              coinsRefunded: coinsSpent,
              reason: adminNotes,
            }),
          },
        });

        return { updatedRedemption, updatedWallet, action: "REFUNDED" };
      }
    });

    return NextResponse.json({
      message: `Redemption ${result.action.toLowerCase()} successfully.`,
      redemption: result.updatedRedemption,
    });
  } catch (error: any) {
    console.error("Admin redemption error:", error.message);
    return NextResponse.json({ message: error.message || "Failed to process redemption." }, { status: 500 });
  }
}
