import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp, rateLimitExceededResponse } from "@/lib/rate-limit";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    // Rate limit: max 3 requests per 10 minutes
    const limit = rateLimit(`resend_verification:${ip}`, 3, 10 * 60 * 1000);
    if (!limit.success) {
      return rateLimitExceededResponse(limit);
    }

    const body = await req.json().catch(() => ({}));
    const { email } = body;

    if (!email) {
      return NextResponse.json({ message: "Email is required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // To prevent account enumeration, return the same friendly message even if user doesn't exist or is already verified
    if (!user) {
      return NextResponse.json({
        message: "If your email is registered and unverified, a new verification link has been sent.",
      });
    }

    if (user.emailVerified) {
      return NextResponse.json({
        message: "Your email address is already verified. You can log in directly.",
        alreadyVerified: true,
      });
    }

    // Generate fresh crypto-random token valid for 24 hours
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.$transaction(async (tx) => {
      // Invalidate any older tokens
      await tx.emailVerificationToken.deleteMany({
        where: { userId: user.id },
      });

      await tx.emailVerificationToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      });
    });

    // Send email (or log preview if in dev mode)
    const emailSent = await sendVerificationEmail(user.email, user.name, token);

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const devVerifyUrl = `${baseUrl}/verify-email?token=${token}`;

    const provideUrlFallback = !emailSent || !process.env.RESEND_API_KEY || process.env.NODE_ENV !== "production";

    return NextResponse.json({
      message: "If your email is registered and unverified, a new verification link has been sent.",
      ...(provideUrlFallback ? { devVerifyUrl } : {}),
    });
  } catch (error: any) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { message: error?.message || "Failed to resend verification email." },
      { status: 500 }
    );
  }
}
