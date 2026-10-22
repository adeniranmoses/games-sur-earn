import { describe, it, expect } from "vitest";
import { rateLimit } from "../rate-limit";

describe("Rate Limiting Utility", () => {
  it("allows requests within the configured threshold", () => {
    const key = `test_limit_${Date.now()}`;
    const res1 = rateLimit(key, 3, 1000);
    const res2 = rateLimit(key, 3, 1000);

    expect(res1.success).toBe(true);
    expect(res1.remaining).toBe(2);

    expect(res2.success).toBe(true);
    expect(res2.remaining).toBe(1);
  });

  it("blocks requests that exceed the limit", () => {
    const key = `test_exceed_${Date.now()}`;
    rateLimit(key, 2, 5000);
    rateLimit(key, 2, 5000);

    // Third request should be blocked
    const res3 = rateLimit(key, 2, 5000);
    expect(res3.success).toBe(false);
    expect(res3.remaining).toBe(0);
    expect(res3.resetInSeconds).toBeGreaterThan(0);
  });

  it("resets and allows new requests after the window expires", async () => {
    const key = `test_window_${Date.now()}`;
    rateLimit(key, 1, 50); // 50ms window

    const blocked = rateLimit(key, 1, 50);
    expect(blocked.success).toBe(false);

    // Wait 60ms for window to lapse
    await new Promise((r) => setTimeout(r, 60));

    const refreshed = rateLimit(key, 1, 50);
    expect(refreshed.success).toBe(true);
  });
});
