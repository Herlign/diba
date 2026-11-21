import { describe, expect, it } from "vitest"
import { signPassToken, verifyPassToken } from "@/lib/passes/token"

describe("pass tokens", () => {
  it("round-trips a signed slot pass and rejects a tampered one", () => {
    const token = signPassToken("order-slot", "meal-slot", 1_800_000_000, "pass-secret")
    expect(verifyPassToken(token, "pass-secret")).toEqual({
      orderSlotId: "order-slot",
      mealSlotId: "meal-slot",
      expiryUnix: 1_800_000_000,
    })
    expect(verifyPassToken(token, "other")).toBeNull()
    expect(verifyPassToken(token.replace("meal-slot", "other-slot"), "pass-secret")).toBeNull()
  })
})
