/**
 * Daily Ad Watch API
 * GET  /api/ads/watch  — Returns today's watch counts and remaining per tier
 * POST /api/ads/watch  — Records a watched ad, validates daily cap, credits coins
 *
 * Tiers & Coin Rates (configured in schema):
 *   STANDARD = 50 coins/ad  (max 10/day)
 *   GOLD     = 100 coins/ad (max 10/day)
 *   PREMIUM  = 200 coins/ad (max 10/day)
 *
 * Max earnings per day from ads:
 *   STANDARD: 500 coins ($0.50)
 *   GOLD:    1000 coins ($1.00)
 *   PREMIUM: 2000 coins ($2.00)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";
import { assertNoVpn } from "@/lib/fraud";
import crypto from "crypto";

const AD_TIERS = {
  STANDARD: { coinsPerAd: 50,  maxPerDay: 10, duration: 15 },
  GOLD:     { coinsPerAd: 100, maxPerDay: 10, duration: 20 },
  PREMIUM:  { coinsPerAd: 200, maxPerDay: 10, duration: 30 },
} as const;

type AdTier = keyof typeof AD_TIERS;

// Cache of redeemed session nonces to prevent replay attacks
const usedNonces = new Set<string>();

// Cleanup stale nonces every 15 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    // Keep set bounded
    if (usedNonces.size > 50000) {
      usedNonces.clear();
    }
  }, 15 * 60 * 1000);
}

function getSigningSecret(): string {
  return process.env.NEXTAUTH_SECRET || "fallback_ads_secret_for_local_dev_only";
}

function signSessionToken(userId: string, tier: AdTier, startedAt: number, nonce: string): string {
  const secret = getSigningSecret();
  const data = `${userId}:${tier}:${startedAt}:${nonce}`;
  const hmac = crypto.createHmac("sha256", secret).update(data).digest("hex");
  const payload = Buffer.from(JSON.stringify({ userId, tier, startedAt, nonce })).toString("base64url");
  return `${payload}.${hmac}`;
}

function verifySessionToken(token: string): { userId: string; tier: AdTier; startedAt: number; nonce: string } | null {
  try {
    const [payloadB64, receivedHmac] = token.split(".");
    if (!payloadB64 || !receivedHmac) return null;

    const payloadStr = Buffer.from(payloadB64, "base64url").toString("utf8");
    const parsed = JSON.parse(payloadStr);
    const { userId, tier, startedAt, nonce } = parsed;

    if (!userId || !tier || !startedAt || !nonce || !AD_TIERS[tier as AdTier]) {
      return null;
    }

    const secret = getSigningSecret();
    const expectedData = `${userId}:${tier}:${startedAt}:${nonce}`;
    const expectedHmac = crypto.createHmac("sha256", secret).update(expectedData).digest("hex");

    const valid = crypto.timingSafeEqual(
      Buffer.from(receivedHmac, "hex"),
      Buffer.from(expectedHmac, "hex")
    );

    return valid ? { userId, tier: tier as AdTier, startedAt, nonce } : null;
  } catch {
    return null;
  }
}

/** Returns the start of today (UTC midnight) */
function startOfTodayUTC(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// ─── GET: Return today's watch counts per tier ────────────────────────────────
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const todayStart = startOfTodayUTC();

    // Count today's watches grouped by tier
    const todayWatches = await prisma.dailyAdWatch.groupBy({
      by: ["tier"],
      where: {
        userId,
        watchedAt: { gte: todayStart },
      },
      _count: { tier: true },
    });

    const watchedToday: Record<string, number> = {};
    for (const row of todayWatches) {
      watchedToday[row.tier] = row._count.tier;
    }

    const tiers = (Object.keys(AD_TIERS) as AdTier[]).map((tier) => ({
      tier,
      coinsPerAd: AD_TIERS[tier].coinsPerAd,
      maxPerDay: AD_TIERS[tier].maxPerDay,
      duration: AD_TIERS[tier].duration,
      watchedToday: watchedToday[tier] ?? 0,
      remaining: Math.max(0, AD_TIERS[tier].maxPerDay - (watchedToday[tier] ?? 0)),
      maxDailyCoins: AD_TIERS[tier].coinsPerAd * AD_TIERS[tier].maxPerDay,
    }));

    return NextResponse.json({ tiers });
  } catch (error: any) {
    console.error("[Ads Watch GET] Error:", error.message);
    return NextResponse.json({ message: "Failed to load ad watch status." }, { status: 500 });
  }
}

// ─── POST: Handles starting a watch session & claiming completed rewards ─────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id as string;

    // Security: Block VPN/Proxy/Tor to prevent bot farms
    const vpnCheck = await assertNoVpn(req, "ads-watch");
    if (!vpnCheck.allowed) {
      return vpnCheck.errorResponse!;
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || (body.sessionToken ? "claim" : "start");

    // ── STEP 1: START AD WATCH SESSION ───────────────────────────────────────
    if (action === "start") {
      const limit = rateLimit(`ads_start:${userId}`, 10, 60 * 1000);
      if (!limit.success) {
        return rateLimitExceededResponse(limit);
      }

      const { tier } = body;
      if (!tier || !AD_TIERS[tier as AdTier]) {
        return NextResponse.json(
          { message: "Invalid tier. Must be STANDARD, GOLD, or PREMIUM." },
          { status: 400 }
        );
      }

      const adTier = tier as AdTier;
      const todayStart = startOfTodayUTC();

      // Check remaining daily watches before issuing start token
      const watchedCount = await prisma.dailyAdWatch.count({
        where: {
          userId,
          tier: adTier,
          watchedAt: { gte: todayStart },
        },
      });

      if (watchedCount >= AD_TIERS[adTier].maxPerDay) {
        return NextResponse.json(
          { message: `Daily limit reached for ${adTier} ads (${AD_TIERS[adTier].maxPerDay}/${AD_TIERS[adTier].maxPerDay} watched today).` },
          { status: 429 }
        );
      }

      const startedAt = Date.now();
      const nonce = crypto.randomBytes(16).toString("hex");
      const sessionToken = signSessionToken(userId, adTier, startedAt, nonce);

      return NextResponse.json({
        sessionToken,
        tier: adTier,
        duration: AD_TIERS[adTier].duration,
        coinsPerAd: AD_TIERS[adTier].coinsPerAd,
      });
    }

    // ── STEP 2: CLAIM REWARD WITH VERIFIED SESSION TOKEN ─────────────────────
    if (action === "claim") {
      const limit = rateLimit(`ads_claim:${userId}`, 10, 60 * 1000);
      if (!limit.success) {
        return rateLimitExceededResponse(limit);
      }

      const { sessionToken } = body;
      if (!sessionToken || typeof sessionToken !== "string") {
        return NextResponse.json(
          { message: "Missing or invalid watch session token." },
          { status: 400 }
        );
      }

      const verification = verifySessionToken(sessionToken);
      if (!verification) {
        return NextResponse.json(
          { message: "Invalid or forged session token." },
          { status: 401 }
        );
      }

      if (verification.userId !== userId) {
        return NextResponse.json(
          { message: "Unauthorized token ownership." },
          { status: 403 }
        );
      }

      // Check replay attack (nonce reuse)
      if (usedNonces.has(verification.nonce)) {
        return NextResponse.json(
          { message: "This ad reward has already been claimed." },
          { status: 409 }
        );
      }

      const adTier = verification.tier;
      const { coinsPerAd, maxPerDay, duration } = AD_TIERS[adTier];
      const now = Date.now();
      const elapsedMs = now - verification.startedAt;

      // Allow 2.0s network buffer for clock variance
      const minRequiredMs = Math.max(0, (duration - 2) * 1000);
      if (elapsedMs < minRequiredMs) {
        const remainingSec = Math.ceil((minRequiredMs - elapsedMs) / 1000);
        return NextResponse.json(
          { message: `Video not finished. Please watch for ${remainingSec} more second(s) to claim reward.` },
          { status: 400 }
        );
      }

      // Session expires after 10 minutes
      if (elapsedMs > 10 * 60 * 1000) {
        return NextResponse.json(
          { message: "Watch session expired. Please start a new video." },
          { status: 400 }
        );
      }

      // Mark nonce as spent immediately
      usedNonces.add(verification.nonce);

      const todayStart = startOfTodayUTC();

      // Pre-fetch wallet OUTSIDE the transaction to reduce queries inside
      const wallet = await prisma.wallet.findUnique({ where: { userId } });
      if (!wallet) {
        return NextResponse.json({ message: "Wallet not found." }, { status: 404 });
      }

      // Atomic: check daily cap + credit coins in one transaction
      const result = await prisma.$transaction(async (tx) => {
        const watchedCount = await tx.dailyAdWatch.count({
          where: {
            userId,
            tier: adTier,
            watchedAt: { gte: todayStart },
          },
        });

        if (watchedCount >= maxPerDay) {
          throw new Error(
            `Daily limit reached for ${adTier} ads. You've watched ${watchedCount}/${maxPerDay} today. Resets at midnight UTC.`
          );
        }

        // Record the watch
        await tx.dailyAdWatch.create({
          data: {
            userId,
            tier: adTier,
            coinsEarned: coinsPerAd,
          },
        });

        // Credit coins to wallet (wallet.id already known from pre-fetch)
        const updatedWallet = await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            availableCoins: { increment: coinsPerAd },
            lifetimeEarnedCoins: { increment: coinsPerAd },
          },
        });

        // Write ledger row with unique nonce reference to prevent duplicate claims
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: "VIDEO_AD_REWARD",
            coins: coinsPerAd,
            status: "APPROVED",
            description: `Watched ${adTier} video ad (+${coinsPerAd} Coins)`,
            referenceId: `AD-${adTier}-${userId}-${verification.nonce}`,
          },
        });

        return {
          newBalance: updatedWallet.availableCoins,
          watchedToday: watchedCount + 1,
          remaining: maxPerDay - (watchedCount + 1),
          coinsEarned: coinsPerAd,
        };
      }, {
        maxWait: 15000,
        timeout: 30000,
      });

      return NextResponse.json({
        message: `+${result.coinsEarned} Coins earned! You've watched ${result.watchedToday}/${maxPerDay} ${adTier} ads today.`,
        coinsEarned: result.coinsEarned,
        newBalance: result.newBalance,
        watchedToday: result.watchedToday,
        remaining: result.remaining,
      });
    }

    return NextResponse.json({ message: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    console.error("[Ads Watch POST] Error:", error.message);
    if (error.message?.includes("Daily limit reached")) {
      return NextResponse.json({ message: error.message }, { status: 429 });
    }
    return NextResponse.json({ message: error.message || "Failed to process ad watch." }, { status: 500 });
  }
}
