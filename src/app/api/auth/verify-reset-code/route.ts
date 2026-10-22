import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp, rateLimitExceededResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    // Rate limit: max 10 code verification attempts per 10 minutes per IP
    const limit = rateLimit(`verify_reset_code:${ip}`, 10, 10 * 60 * 1000);
    if (!limit.success) {
      return rateLimitExceededResponse(limit);
    }

    const body = await req.json().catch(() => ({}));
    const { email, code } = body;

    if (!email || typeof email !== "string" || !code || typeof code !== "string") {
      return NextResponse.json({ message: "Email and 6-digit code are required." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanCode = code.trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json({ message: "Invalid or expired verification code." }, { status: 400 });
    }

    const resetRecord = await prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        token: cleanCode,
      },
    });

    if (!resetRecord) {
      return NextResponse.json({ message: "Invalid verification code. Please check your email and try again." }, { status: 400 });
    }

    if (resetRecord.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { id: resetRecord.id } }).catch(() => {});
      return NextResponse.json({ message: "This code has expired. Please request a new one." }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Code verified successfully!" });
  } catch (error: any) {
    console.error("Code verification error:", error);
    return NextResponse.json({ message: "Failed to verify code. Please try again." }, { status: 500 });
  }
}
