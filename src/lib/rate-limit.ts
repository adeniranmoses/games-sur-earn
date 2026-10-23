import { NextRequest, NextResponse } from "next/server";

interface RateLimitRecord {
  timestamps: number[];
}

// In-memory store for rate limiting (can be swapped for Upstash Redis in multi-region clusters)
const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale keys every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      // Retain only timestamps from the last 15 minutes
      const validTimestamps = record.timestamps.filter((t) => now - t < 15 * 60 * 1000);
      if (validTimestamps.length === 0) {
        rateLimitStore.delete(key);
      } else {
        record.timestamps = validTimestamps;
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Sliding window rate limiter.
 * @param key Unique key, e.g. "auth_register:192.168.1.1" or "forgot_pwd:user@email.com"
 * @param limit Maximum allowed requests in the time window
 * @param windowMs Window duration in milliseconds (default: 60,000ms = 1 minute)
 */
export function rateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60 * 1000
): RateLimitResult {
  // Generous limit only in development to prevent developer lockouts during manual testing
  const effectiveLimit = process.env.NODE_ENV === "development" ? Math.max(limit, 100) : limit;

  const now = Date.now();
  const windowStart = now - windowMs;

  const record = rateLimitStore.get(key) || { timestamps: [] };

  // Filter timestamps within the current sliding window
  const activeTimestamps = record.timestamps.filter((t) => t > windowStart);

  if (activeTimestamps.length >= effectiveLimit) {
    const oldestTimestamp = activeTimestamps[0];
    const resetInSeconds = Math.ceil((oldestTimestamp + windowMs - now) / 1000);

    return {
      success: false,
      limit: effectiveLimit,
      remaining: 0,
      resetInSeconds: Math.max(1, resetInSeconds),
    };
  }

  // Record this attempt
  activeTimestamps.push(now);
  rateLimitStore.set(key, { timestamps: activeTimestamps });

  return {
    success: true,
    limit: effectiveLimit,
    remaining: effectiveLimit - activeTimestamps.length,
    resetInSeconds: Math.ceil(windowMs / 1000),
  };
}

/**
 * Extracts the client IP address from request headers with fallback
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

/**
 * Standard 429 Too Many Requests response with retry headers
 */
export function rateLimitExceededResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      message: `Too many requests. Please wait ${result.resetInSeconds} seconds before trying again.`,
      retryAfterSeconds: result.resetInSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": result.resetInSeconds.toString(),
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": "0",
      },
    }
  );
}
