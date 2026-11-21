import { describe, expect, it } from "vitest"
import { rateLimit } from "@/lib/rate-limit"

describe("rate limit", () => {
  it("allows a burst and then refuses until the window passes", () => {
    const key = `test-${Date.now()}`
    expect(rateLimit(key, 2, 1000, 0)).toBe(true)
    expect(rateLimit(key, 2, 1000, 10)).toBe(true)
    expect(rateLimit(key, 2, 1000, 20)).toBe(false)
    expect(rateLimit(key, 2, 1000, 2000)).toBe(true)
  })
})
