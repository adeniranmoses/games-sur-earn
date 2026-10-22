import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp, rateLimitExceededResponse } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limit = rateLimit(`verify_email_get:${ip}`, 20, 60 * 1000);
    if (!limit.success) {
      return rateLimitExceededResponse(limit);
    }

    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ message: "Verification token is required." }, { status: 400 });
    }

    const verificationRecord = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verificationRecord) {
      return NextResponse.json(
        { message: "Invalid or expired verification link. Please request a new one." },
        { status: 400 }
      );
    }

    if (verificationRecord.expiresAt < new Date()) {
      // Clean up expired token
      await prisma.emailVerificationToken.delete({ where: { id: verificationRecord.id } }).catch(() => {});
      return NextResponse.json(
        { message: "This verification link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Verify user and delete tokens in a single transaction
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: verificationRecord.userId },
        data: { emailVerified: true },
      });

      // Clear all pending verification tokens for this user
      await tx.emailVerificationToken.deleteMany({
        where: { userId: verificationRecord.userId },
      });
    });

    return NextResponse.json({
      message: "Email verified successfully! You can now access all earning and withdrawal features.",
      email: verificationRecord.user.email,
    });
  } catch (error: any) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { message: error?.message || "Failed to verify email. Please try again." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limit = rateLimit(`verify_email_post:${ip}`, 10, 60 * 1000);
    if (!limit.success) {
      return rateLimitExceededResponse(limit);
    }

    const body = await req.json().catch(() => ({}));
    const { token } = body;

    if (!token) {
      return NextResponse.json({ message: "Verification token is required." }, { status: 400 });
    }

    const verificationRecord = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verificationRecord) {
      return NextResponse.json(
        { message: "Invalid or expired verification link." },
        { status: 400 }
      );
    }

    if (verificationRecord.expiresAt < new Date()) {
      await prisma.emailVerificationToken.delete({ where: { id: verificationRecord.id } }).catch(() => {});
      return NextResponse.json(
        { message: "This verification token has expired. Please request a new one." },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: verificationRecord.userId },
        data: { emailVerified: true },
      });

      await tx.emailVerificationToken.deleteMany({
        where: { userId: verificationRecord.userId },
      });
    });

    return NextResponse.json({
      message: "Email verified successfully!",
      email: verificationRecord.user.email,
    });
  } catch (error: any) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { message: error?.message || "Verification failed." },
      { status: 500 }
    );
  }
}
