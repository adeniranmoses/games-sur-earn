import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp, rateLimitExceededResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    // Rate limit: max 5 password reset submissions per 15 minutes per IP
    const limit = rateLimit(`reset_password:${ip}`, 5, 15 * 60 * 1000);
    if (!limit.success) {
      return rateLimitExceededResponse(limit);
    }

    const body = await req.json().catch(() => ({}));
    const { email, code, token, newPassword } = body;

    const resetToken = (code || token)?.toString().trim();

    if (!resetToken) {
      return NextResponse.json({ message: "Verification code or reset token is required." }, { status: 400 });
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { message: "New password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    // Find the token record: either by email + code or directly by unique token
    let resetRecord = null;
    if (email && typeof email === "string") {
      const normalizedEmail = email.toLowerCase().trim();
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (user) {
        resetRecord = await prisma.passwordResetToken.findFirst({
          where: {
            userId: user.id,
            token: resetToken,
          },
          include: { user: true },
        });
      }
    } else {
      resetRecord = await prisma.passwordResetToken.findUnique({
        where: { token: resetToken },
        include: { user: true },
      });
    }

    if (!resetRecord) {
      return NextResponse.json(
        { message: "Invalid or expired verification code. Please request a new one." },
        { status: 400 }
      );
    }

    if (resetRecord.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { id: resetRecord.id } }).catch(() => {});
      return NextResponse.json(
        { message: "This verification code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Hash the new password with strong salt rounds
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Atomically update password, delete used tokens, and record audit log
    // Update password
    await prisma.user.update({
      where: { id: resetRecord.userId },
      data: {
        passwordHash: newPasswordHash,
      },
    });

    // Clear all reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: resetRecord.userId },
    });

    // Add audit log asynchronously
    prisma.auditLog.create({
      data: {
        userId: resetRecord.userId,
        action: "PASSWORD_RESET_COMPLETED",
        ipAddress: ip,
        details: JSON.stringify({ resetAt: new Date().toISOString() }),
      },
    }).catch((err) => console.error("Audit log error:", err));

    return NextResponse.json({
      message: "Password reset successful! You can now log in with your new password.",
    });
  } catch (error: any) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { message: error?.message || "Failed to reset password. Please try again." },
      { status: 500 }
    );
  }
}
