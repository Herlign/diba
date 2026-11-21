import { describe, expect, it } from "vitest"
import { checkoutSlotState } from "@/lib/checkout/capacity"

const now = new Date("2026-12-20T10:00:00.000Z")
const deliveryStart = new Date("2026-12-27T06:00:00.000Z")

function state(orders: { status: string; createdAt: Date }[], capacity: number | null = 2) {
  return checkoutSlotState({
    programmeStatus: "PUBLISHED",
    isOpen: true,
    hasMenu: true,
    now,
    deliveryStart,
    cutoffHours: 24,
    capacity,
    orders,
  })
}

describe("checkout capacity", () => {
  it("sells the last seat to a paid order plus a fresh pending order", () => {
    expect(
      state([
        { status: "PAID", createdAt: new Date("2026-12-01T00:00:00.000Z") },
        { status: "PENDING_PAYMENT", createdAt: new Date(now.getTime() - 10 * 60 * 1000) },
      ]),
    ).toBe("sold_out")
  })

  it("releases a pending hold after 30 minutes", () => {
    expect(
      state(
        [{ status: "PENDING_PAYMENT", createdAt: new Date(now.getTime() - 31 * 60 * 1000) }],
        1,
      ),
    ).toBe("open")
  })

  it("keeps a fulfilled meal on the seat", () => {
    expect(state([{ status: "FULFILLED", createdAt: new Date("2026-12-01T00:00:00.000Z") }], 1)).toBe("sold_out")
  })

  it("ignores cancelled orders", () => {
    expect(state([{ status: "CANCELLED", createdAt: now }], 1)).toBe("open")
  })

  it("closes the slot at the cutoff even when seats remain", () => {
    const late = new Date(deliveryStart.getTime() - 24 * 60 * 60 * 1000)
    expect(
      checkoutSlotState({
        programmeStatus: "PUBLISHED",
        isOpen: true,
        hasMenu: true,
        now: late,
        deliveryStart,
        cutoffHours: 24,
        capacity: 300,
        orders: [],
      }),
    ).toBe("ordering_closed")
  })
})
