import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp, rateLimitExceededResponse } from "@/lib/rate-limit";
import { sendPasswordResetOtp } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    // Strict rate limit: max 5 password reset requests per 15 minutes per IP
    const limit = rateLimit(`forgot_password:${ip}`, 5, 15 * 60 * 1000);
    if (!limit.success) {
      return rateLimitExceededResponse(limit);
    }

    const body = await req.json().catch(() => ({}));
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ message: "Valid email address is required." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      if (process.env.NODE_ENV !== "production") {
        return NextResponse.json(
          { message: `No account exists with email "${normalizedEmail}". Please check your email or create an account.` },
          { status: 404 }
        );
      }
      return NextResponse.json({
        message: "If an account exists with this email, a 6-digit verification code has been dispatched to your inbox.",
      });
    }

    // Do not allow password reset for banned accounts
    if (user.accountStatus === "BANNED") {
      return NextResponse.json(
        { message: "This account has been banned. Please contact support." },
        { status: 403 }
      );
    }

    // Generate secure 6-digit numeric OTP code without collision
    let otpCode = crypto.randomInt(100000, 1000000).toString();
    let collision = await prisma.passwordResetToken.findUnique({ where: { token: otpCode } });
    let safetyCounter = 0;
    while (collision && safetyCounter < 10) {
      otpCode = crypto.randomInt(100000, 1000000).toString();
      collision = await prisma.passwordResetToken.findUnique({ where: { token: otpCode } });
      safetyCounter++;
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Invalidate existing reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Store new OTP token
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: otpCode,
        expiresAt,
      },
    });

    // Log security audit asynchronously without blocking
    prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "PASSWORD_RESET_OTP_REQUESTED",
        ipAddress: ip,
        details: JSON.stringify({ email: normalizedEmail, requestedAt: new Date().toISOString() }),
      },
    }).catch((err) => console.error("Audit log error:", err));

    // Send transactional email with the 6-digit code
    await sendPasswordResetOtp(user.email, user.name, otpCode);

    return NextResponse.json({
      message: "A 6-digit verification code has been dispatched to your email.",
      // Only return devOtp fallback if no Resend API key is provided
      ...(!process.env.RESEND_API_KEY ? { devOtp: otpCode } : {}),
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { message: error?.message || "Unable to process request. Please try again later." },
      { status: 500 }
    );
  }
}
