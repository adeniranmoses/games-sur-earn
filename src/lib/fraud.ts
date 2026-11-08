import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "./rate-limit";

export interface FraudCheckResult {
  ip: string;
  isVpn: boolean;
  isProxy: boolean;
  isTor: boolean;
  isDatacenter: boolean;
  countryCode: string;
  riskScore: number; // 0 to 100
  operator?: string;
  reason?: string;
  allowed: boolean;
}

// In-memory cache to prevent redundant API queries for the same IP (1 hour TTL)
interface CacheEntry {
  result: FraudCheckResult;
  expiresAt: number;
}
const ipCache = new Map<string, CacheEntry>();

/**
 * Checks if an IP is local, loopback, or private LAN
 */
function isPrivateIp(ip: string): boolean {
  if (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "localhost" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("172.17.") ||
    ip.startsWith("172.18.") ||
    ip.startsWith("172.19.") ||
    ip.startsWith("172.2") ||
    ip.startsWith("172.30.") ||
    ip.startsWith("172.31.") ||
    ip.startsWith("fc00:") ||
    ip.startsWith("fe80:")
  ) {
    return true;
  }
  return false;
}

/**
 * Inspects an IP address against VPN, Tor, Proxy, and Datacenter registries.
 * Uses ProxyCheck.io (with fallback to ip-api.com).
 */
export async function checkIpFraud(ip: string): Promise<FraudCheckResult> {
  // 1. Safe Pass for Local Development & Internal Networks
  if (isPrivateIp(ip)) {
    return {
      ip,
      isVpn: false,
      isProxy: false,
      isTor: false,
      isDatacenter: false,
      countryCode: "US",
      riskScore: 0,
      operator: "Local Network / Development",
      allowed: true,
    };
  }

  // 2. Check in-memory cache
  const cached = ipCache.get(ip);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result;
  }

  // 3. Query ProxyCheck.io (industry standard for reward platforms)
  try {
    const proxyCheckKey = process.env.PROXYCHECK_API_KEY || "";
    const keyParam = proxyCheckKey ? `&key=${proxyCheckKey}` : "";
    const url = `https://proxycheck.io/v2/${encodeURIComponent(ip)}?vpn=1&asn=1&risk=1${keyParam}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500); // 2.5s maximum wait

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.status === "ok" && data[ip]) {
        const info = data[ip];
        const isProxy = info.proxy === "yes";
        const isVpn = info.type === "VPN" || isProxy;
        const isTor = info.type === "TOR";
        const risk = Number(info.risk) || (isProxy ? 85 : 0);
        const countryCode = info.isocode || info.country || "GLOBAL";
        const operator = info.operator?.name || info.organisation || "Unknown ISP";

        const allowed = !isVpn && !isTor && risk < 65;

        const result: FraudCheckResult = {
          ip,
          isVpn,
          isProxy,
          isTor,
          isDatacenter: info.type === "Compromised Server" || isProxy,
          countryCode,
          riskScore: risk,
          operator,
          reason: isTor
            ? "Tor exit node detected"
            : isVpn
            ? "VPN or Proxy connection detected"
            : risk >= 65
            ? "High fraud risk score"
            : undefined,
          allowed,
        };

        // Cache for 1 hour
        ipCache.set(ip, { result, expiresAt: Date.now() + 60 * 60 * 1000 });
        return result;
      }
    }
  } catch (err: any) {
    console.warn(`[FraudShield] ProxyCheck query failed or timed out for ${ip}:`, err.message);
  }

  // 4. Fallback: Query ip-api.com for datacenter/hosting flag (free, no key needed)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,countryCode,hosting,proxy`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.status === "success") {
        const isDatacenter = Boolean(data.hosting);
        const isProxy = Boolean(data.proxy);
        const isVpn = isProxy || isDatacenter;
        const riskScore = isProxy ? 90 : isDatacenter ? 75 : 0;
        const countryCode = data.countryCode || "GLOBAL";
        const allowed = !isProxy && !isDatacenter;

        const result: FraudCheckResult = {
          ip,
          isVpn,
          isProxy,
          isTor: false,
          isDatacenter,
          countryCode,
          riskScore,
          operator: isDatacenter ? "Hosting Datacenter" : "Residential",
          reason: isVpn ? "Datacenter or proxy IP detected" : undefined,
          allowed,
        };

        ipCache.set(ip, { result, expiresAt: Date.now() + 60 * 60 * 1000 });
        return result;
      }
    }
  } catch (err: any) {
    console.warn(`[FraudShield] Fallback ip-api query failed for ${ip}:`, err.message);
  }

  // 5. Fail-open fallback: If external fraud lookup APIs are unreachable, do not hard-block legitimate users
  const fallbackResult: FraudCheckResult = {
    ip,
    isVpn: false,
    isProxy: false,
    isTor: false,
    isDatacenter: false,
    countryCode: "GLOBAL",
    riskScore: 10,
    operator: "Unverified ISP",
    allowed: true,
  };

  return fallbackResult;
}

/**
 * Express/Next.js middleware guard to block VPN/Proxy access on sensitive routes
 */
export async function assertNoVpn(
  req: NextRequest,
  _actionName: string = "action"
): Promise<{ allowed: boolean; result: FraudCheckResult; errorResponse?: NextResponse }> {
  const ip = getClientIp(req);
  const result = await checkIpFraud(ip);

  if (!result.allowed) {
    return {
      allowed: false,
      result,
      errorResponse: NextResponse.json(
        {
          error: "FRAUD_SECURITY_BLOCK",
          message:
            "Security Alert: VPN, proxy, or hosting network detected. To prevent offerwall fraud, you must disconnect any VPN or proxy to continue.",
          reason: result.reason,
          riskScore: result.riskScore,
        },
        { status: 403 }
      ),
    };
  }

  return { allowed: true, result };
}
