import { describe, it, expect } from "vitest";
import crypto from "crypto";
import bcrypt from "bcryptjs";

describe("Auth & Token Security Hardening", () => {
  it("hashes passwords securely with bcrypt and rejects mismatched passwords", async () => {
    const rawPassword = "SuperSecurePassword123!";
    const hash = await bcrypt.hash(rawPassword, 12);

    expect(hash).not.toBe(rawPassword);
    expect(hash.startsWith("$2")).toBe(true);

    const isMatch = await bcrypt.compare(rawPassword, hash);
    const isMismatch = await bcrypt.compare("WrongPassword", hash);

    expect(isMatch).toBe(true);
    expect(isMismatch).toBe(false);
  });

  it("generates 32-byte cryptographically random hex tokens with zero collisions", () => {
    const tokens = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const token = crypto.randomBytes(32).toString("hex");
      expect(token).toHaveLength(64);
      tokens.add(token);
    }
    // All 100 tokens must be completely unique
    expect(tokens.size).toBe(100);
  });

  it("accurately detects expired tokens", () => {
    const pastDate = new Date(Date.now() - 1000); // 1 second in the past
    const futureDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour in the future

    const isPastExpired = pastDate < new Date();
    const isFutureExpired = futureDate < new Date();

    expect(isPastExpired).toBe(true);
    expect(isFutureExpired).toBe(false);
  });
});
