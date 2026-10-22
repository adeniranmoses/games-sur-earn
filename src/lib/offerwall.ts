/**
 * Shared Offerwall Utilities
 *
 * Contains:
 *  - Signature validators for each provider (HMAC-SHA1 for BitLabs, MD5 for CPX Research)
 *  - The shared atomic `creditUser()` function that all webhooks call to credit coins
 *    and write the ledger row — single source of truth, prevents duplication.
 */

import crypto from "crypto";
import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────────────────────────────────────
// BITLABS — HMAC-SHA1 Signature Validation
// Docs: https://bitlabs.ai/docs/postback
//
// BitLabs appends &hash=<hex> to the postback URL.
// The signature is: HMAC-SHA1(urlWithoutHashParam, appSecret)
// The raw URL string (up to &hash=) is signed — do NOT decode/encode it.
// ─────────────────────────────────────────────────────────────────────────────
export function validateBitLabsSignature(
  fullUrl: string,
  appSecret: string
): boolean {
  const hashIndex = fullUrl.indexOf("&hash=");
  if (hashIndex === -1) return false;

  const urlWithoutHash = fullUrl.substring(0, hashIndex);
  const receivedHash = fullUrl.substring(hashIndex + 6); // skip "&hash="

  const expectedHash = crypto
    .createHmac("sha1", appSecret)
    .update(urlWithoutHash)
    .digest("hex");

  // Timing-safe comparison to prevent timing-attack exploits
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedHash, "hex"),
      Buffer.from(receivedHash, "hex")
    );
  } catch {
    return false; // buffers were different lengths → invalid
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CPX RESEARCH — MD5 Hash Validation
// Docs: https://publisher.cpx-research.com
//
// CPX appends &hash=<md5> to the postback URL.
// The hash formula (as documented): MD5(trans_id + "-" + appKey)
// ─────────────────────────────────────────────────────────────────────────────
export function validateCpxSignature(
  transId: string,
  receivedHash: string,
  appKey: string
): boolean {
  const expectedHash = crypto
    .createHash("md5")
    .update(`${transId}-${appKey}`)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedHash, "hex"),
      Buffer.from(receivedHash, "hex")
    );
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED — Atomic Credit + Ledger Write
//
// All provider webhooks call this single function.
// It is idempotent: if externalTxId + provider already exists, it returns
// `{ alreadyProcessed: true }` without touching the DB again.
// ─────────────────────────────────────────────────────────────────────────────
export type CreditResult =
  | { alreadyProcessed: true }
  | { alreadyProcessed: false; newBalance: number };

export interface CreditParams {
  /** Your platform's userId (NOT the provider's uid — must be resolved before calling) */
  userId: string;
  /** Coins to credit (always a positive integer) */
  coins: number;
  /** Provider name for the ledger: "bitlabs" | "cpxresearch" */
  provider: string;
  /** Provider's unique transaction ID — used for idempotency */
  externalTxId: string;
  /** Human-readable ledger description */
  description: string;
  /** OFFER_REWARD or SURVEY_REWARD */
  type?: "OFFER_REWARD" | "SURVEY_REWARD";
}

export async function creditUser(params: CreditParams): Promise<CreditResult> {
  const {
    userId,
    coins,
    provider,
    externalTxId,
    description,
    type = "OFFER_REWARD",
  } = params;

  const result = await prisma.$transaction(async (tx) => {
    // 1. Idempotency guard — reject duplicates
    const existing = await tx.walletTransaction.findFirst({
      where: { externalTxId, provider },
    });
    if (existing) return { alreadyProcessed: true as const };

    // 2. Fetch wallet
    const wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new Error(`Wallet not found for userId=${userId}`);

    // 3. Write ledger row
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type,
        coins,
        status: "APPROVED",
        description,
        provider,
        externalTxId,
        referenceId: `${provider.toUpperCase()}-${Date.now()}-${Math.floor(
          Math.random() * 10000
        )}`,
      },
    });

    // 4. Update wallet balances
    const updated = await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        availableCoins: { increment: coins },
        lifetimeEarnedCoins: { increment: coins },
      },
    });

    return { alreadyProcessed: false as const, newBalance: updated.availableCoins };
  });

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED — Atomic Reversal (for chargebacks / reconciliations)
//
// Deducts coins when a provider fires a reversal/chargeback postback.
// Also idempotent — won't process the same reversal twice.
// ─────────────────────────────────────────────────────────────────────────────
export interface ReversalParams {
  userId: string;
  coins: number;
  provider: string;
  externalTxId: string; // The ORIGINAL tx ID that is being reversed
  description: string;
}

export async function reversalUser(params: ReversalParams): Promise<CreditResult> {
  const { userId, coins, provider, externalTxId, description } = params;

  // Reversal reference uses a distinct prefix so it's a unique ledger row
  const reversalExternalId = `REVERSAL-${externalTxId}`;

  const result = await prisma.$transaction(async (tx) => {
    // Idempotency guard for the reversal itself
    const existing = await tx.walletTransaction.findFirst({
      where: { externalTxId: reversalExternalId, provider },
    });
    if (existing) return { alreadyProcessed: true as const };

    const wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new Error(`Wallet not found for userId=${userId}`);

    // Deduct — cap at 0 to avoid negative balances
    const deduct = Math.min(coins, wallet.availableCoins);

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "REVERSAL",
        coins: deduct,
        status: "REVERSED",
        description,
        provider,
        externalTxId: reversalExternalId,
        referenceId: `${provider.toUpperCase()}-REV-${Date.now()}`,
      },
    });

    const updated = await tx.wallet.update({
      where: { id: wallet.id },
      data: { availableCoins: { decrement: deduct } },
    });

    return { alreadyProcessed: false as const, newBalance: updated.availableCoins };
  });

  return result;
}
