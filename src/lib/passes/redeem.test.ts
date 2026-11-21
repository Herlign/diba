import { describe, expect, it } from "vitest"
import { assessRedemption, type RedeemSlot } from "@/lib/passes/redeem"
import { signPassToken } from "@/lib/passes/token"

const secret = "pass-secret"
const now = new Date("2026-12-27T06:30:00.000Z")

function slot(overrides: Partial<RedeemSlot> = {}): RedeemSlot {
  return {
    id: "order-slot",
    mealSlotId: "meal-slot",
    status: "SCHEDULED",
    orderStatus: "PAID",
    dateKey: "2026-12-27",
    windowStart: "07:00",
    windowEnd: "09:00",
    ...overrides,
  }
}

function token(expiryUnix = Math.floor(now.getTime() / 1000) + 60 * 60) {
  return signPassToken("order-slot", "meal-slot", expiryUnix, secret)
}

describe("pass redemption", () => {
  it("accepts one valid pass inside today's window", () => {
    expect(assessRedemption({ now, secret, token: token(), orderSlot: slot() })).toEqual({ ok: true })
  })

  it("rejects a pass that was already used", () => {
    const result = assessRedemption({ now, secret, token: token(), orderSlot: slot({ status: "DELIVERED" }) })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/already used/)
  })

  it("rejects an expired pass", () => {
    const expired = token(Math.floor(now.getTime() / 1000) - 60)
    const result = assessRedemption({ now, secret, token: expired, orderSlot: slot() })
    if (!result.ok) expect(result.reason).toMatch(/expired/)
    expect(result.ok).toBe(false)
  })

  it("rejects a tampered pass", () => {
    const result = assessRedemption({ now, secret, token: `${token()}x`, orderSlot: slot() })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/not valid/)
  })

  it("rejects a pass for another day", () => {
    const result = assessRedemption({ now, secret, token: token(), orderSlot: slot({ dateKey: "2026-12-28" }) })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/not today/)
  })

  it("rejects a pass outside the delivery window", () => {
    const early = new Date("2026-12-27T04:00:00.000Z")
    const result = assessRedemption({ now: early, secret, token: token(), orderSlot: slot() })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/window/)
  })
})
