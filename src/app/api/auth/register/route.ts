import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp, rateLimitExceededResponse } from "@/lib/rate-limit";
import { sendVerificationEmail } from "@/lib/email";
import { assertNoVpn } from "@/lib/fraud";

// This function generates a unique referral code like "MOSES123"
function generateReferralCode(name: string): string {
  const prefix = name.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5) || "USER";
  const suffix = Math.floor(100 + Math.random() * 900).toString();
  return `${prefix}${suffix}`;
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    // Security: Rate limit registrations to max 5 per 10 minutes per IP
    const limit = rateLimit(`register:${ip}`, 5, 10 * 60 * 1000);
    if (!limit.success) {
      return rateLimitExceededResponse(limit);
    }

    // Security: Block VPN/Proxy/Tor signups to prevent multi-account fraud
    const vpnCheck = await assertNoVpn(req, "registration");
    if (!vpnCheck.allowed) {
      return vpnCheck.errorResponse!;
    }

    const body = await req.json();
    const { name, email, password, country, referralCode } = body;

    // --- Validation ---
    if (!name || !email || !password) {
      return NextResponse.json({ message: "Name, email, and password are required." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (password.length < 8) {
      return NextResponse.json({ message: "Password must be at least 8 characters long." }, { status: 400 });
    }

    // Check if email is already taken
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return NextResponse.json({ message: "An account with this email already exists." }, { status: 409 });
    }

    // --- Find referrer if a referral code was provided ---
    let referrerId: string | null = null;
    if (referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: referralCode.toUpperCase().trim() },
      });
      if (referrer) {
        referrerId = referrer.id;
      }
    }

    // --- Hash password with high security work factor ---
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate unique referral code with collision safeguards
    let newReferralCode = generateReferralCode(name);
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      const codeExists = await prisma.user.findUnique({ where: { referralCode: newReferralCode } });
      if (!codeExists) break;
      attempts++;
      newReferralCode = generateReferralCode(name);
    }

    if (attempts >= maxAttempts) {
      const cleanPrefix = name.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4) || "USER";
      newReferralCode = `${cleanPrefix}${Date.now().toString(36).toUpperCase().slice(-4)}`;
    }

    // Generate crypto-secure verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // --- Atomic User + Wallet + VerificationToken creation ---
    const { user } = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email: normalizedEmail,
          passwordHash,
          countryCode: country ? country.toUpperCase().slice(0, 2) : "US",
          referralCode: newReferralCode,
          referredById: referrerId,
          emailVerified: false,
        },
      });

      // Automatically create user wallet
      await tx.wallet.create({
        data: {
          userId: newUser.id,
        },
      });

      // Create email verification token
      await tx.emailVerificationToken.create({
        data: {
          userId: newUser.id,
          token: verificationToken,
          expiresAt: tokenExpiresAt,
        },
      });

      // Audit log creation
      await tx.auditLog.create({
        data: {
          userId: newUser.id,
          action: "USER_REGISTERED",
          ipAddress: ip,
          details: JSON.stringify({ email: normalizedEmail, country: newUser.countryCode }),
        },
      });

      return { user: newUser };
    });

    // Send transactional verification email
    try {
      await sendVerificationEmail(user.email, user.name, verificationToken);
    } catch (err) {
      console.error("Failed to send verification email:", err);
    }

    const devVerifyUrl = `/verify-email?token=${verificationToken}`;

    const provideUrlFallback = process.env.NODE_ENV !== "production";

    return NextResponse.json(
      {
        message: "Account created successfully! We've sent a verification link to your email.",
        userId: user.id,
        email: user.email,
        requiresVerification: true,
        ...(provideUrlFallback ? { devVerifyUrl } : {}),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);

    let userMessage = "Registration failed. Please try again.";
    if (error?.code === "P2024" || error?.message?.includes("connection pool")) {
      userMessage = "Database is connecting. Please wait a few seconds and try again.";
    } else if (error?.code === "P2002") {
      userMessage = "An account with this email already exists.";
    }

    return NextResponse.json({ message: userMessage }, { status: 500 });
  }
}
