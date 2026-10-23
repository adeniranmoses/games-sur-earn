import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const hasDbUrl = !!process.env.DATABASE_URL;
    const hasDirectUrl = !!process.env.DIRECT_URL;
    const hasSecret = !!process.env.NEXTAUTH_SECRET;
    const nextAuthUrl = process.env.NEXTAUTH_URL || "not_set";

    const user = await prisma.user.findUnique({
      where: { email: "sarahjoy45@gmail.com" },
      select: {
        id: true,
        email: true,
        role: true,
        emailVerified: true,
        accountStatus: true,
        passwordHash: true,
      },
    });

    const passwordMatches = user
      ? await bcrypt.compare("Admin1234!", user.passwordHash)
      : false;

    return NextResponse.json({
      status: "ok",
      dbConnected: true,
      hasDbUrl,
      hasDirectUrl,
      hasNextAuthSecret: hasSecret,
      nextAuthUrl,
      userFound: !!user,
      userData: user
        ? {
            email: user.email,
            role: user.role,
            emailVerified: user.emailVerified,
            accountStatus: user.accountStatus,
            passwordMatches,
          }
        : null,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        dbConnected: false,
        error: error.message || String(error),
        hasDbUrl: !!process.env.DATABASE_URL,
      },
      { status: 500 }
    );
  }
}
