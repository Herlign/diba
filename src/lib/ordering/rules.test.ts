import { describe, expect, it } from "vitest"
import { fromZonedTime } from "date-fns-tz"
import {
  holdsCapacity,
  planFromPrices,
  quoteTotals,
  selectionSatisfiesPlan,
  slotAvailability,
  type PlanRule,
  type PricedSlot,
} from "./rules"

const morning = fromZonedTime("2026-12-27T07:00:00", "Africa/Lagos")

describe("slot availability", () => {
  it("is open before the cutoff when the programme is published and under capacity", () => {
    const now = fromZonedTime("2026-12-25T12:00:00", "Africa/Lagos")
    expect(
      slotAvailability({
        programmeStatus: "PUBLISHED",
        isOpen: true,
        hasMenu: true,
        now,
        deliveryStart: morning,
        cutoffHours: 24,
        capacity: 300,
        held: 10,
      }),
    ).toBe("open")
  })

  it("closes at the exact cutoff instant", () => {
    const cutoff = new Date(morning.getTime() - 24 * 60 * 60 * 1000)
    expect(
      slotAvailability({
        programmeStatus: "PUBLISHED",
        isOpen: true,
        hasMenu: true,
        now: cutoff,
        deliveryStart: morning,
        cutoffHours: 24,
        capacity: 300,
        held: 0,
      }),
    ).toBe("ordering_closed")
  })

  it("is sold out when paid and pending holds fill the capacity", () => {
    expect(
      slotAvailability({
        programmeStatus: "PUBLISHED",
        isOpen: true,
        hasMenu: true,
        now: fromZonedTime("2026-12-20T10:00:00", "Africa/Lagos"),
        deliveryStart: morning,
        cutoffHours: 24,
        capacity: 2,
        held: 2,
      }),
    ).toBe("sold_out")
  })

  it("is not served when the period has no menu", () => {
    expect(
      slotAvailability({
        programmeStatus: "PUBLISHED",
        isOpen: true,
        hasMenu: false,
        now: fromZonedTime("2026-12-20T10:00:00", "Africa/Lagos"),
        deliveryStart: morning,
        cutoffHours: 24,
        capacity: null,
        held: 0,
      }),
    ).toBe("not_served")
  })

  it("is closed when the programme is not published", () => {
    expect(
      slotAvailability({
        programmeStatus: "CLOSED",
        isOpen: true,
        hasMenu: true,
        now: fromZonedTime("2026-12-20T10:00:00", "Africa/Lagos"),
        deliveryStart: morning,
        cutoffHours: 24,
        capacity: 300,
        held: 0,
      }),
    ).toBe("programme_closed")
  })
})

describe("capacity holds", () => {
  const now = new Date("2026-12-01T12:00:00.000Z")

  it("counts paid orders and pending orders under 30 minutes", () => {
    expect(holdsCapacity("PAID", now, now)).toBe(true)
    expect(holdsCapacity("FULFILLED", now, now)).toBe(true)
    expect(holdsCapacity("PENDING_PAYMENT", new Date(now.getTime() - 10 * 60 * 1000), now)).toBe(true)
  })

  it("releases a pending order after 30 minutes and ignores cancelled orders", () => {
    expect(holdsCapacity("PENDING_PAYMENT", new Date(now.getTime() - 31 * 60 * 1000), now)).toBe(false)
    expect(holdsCapacity("CANCELLED", now, now)).toBe(false)
    expect(holdsCapacity("REFUNDED", now, now)).toBe(false)
  })
})

const fullPlan: PlanRule = {
  coversAllDays: true,
  periodIds: ["morning", "evening"],
  pricingMode: "PERCENT_DISCOUNT",
  fixedPricePerSlotKobo: null,
  discountPercent: 10,
}

describe("meal plan rules", () => {
  const days = ["2026-12-27", "2026-12-28"]

  it("applies a full-programme plan only when every day has every period", () => {
    const complete: PricedSlot[] = days.flatMap((dateKey) => [
      { dateKey, periodId: "morning", lines: [{ quantity: 1, unitPriceKobo: 350000 }] },
      { dateKey, periodId: "evening", lines: [{ quantity: 1, unitPriceKobo: 650000 }] },
    ])
    expect(selectionSatisfiesPlan(fullPlan, days, complete).ok).toBe(true)
  })

  it("falls back when a required slot is missing", () => {
    const missing: PricedSlot[] = [
      { dateKey: "2026-12-27", periodId: "morning", lines: [{ quantity: 1, unitPriceKobo: 350000 }] },
      { dateKey: "2026-12-27", periodId: "evening", lines: [{ quantity: 1, unitPriceKobo: 650000 }] },
      { dateKey: "2026-12-28", periodId: "evening", lines: [{ quantity: 1, unitPriceKobo: 650000 }] },
    ]
    expect(selectionSatisfiesPlan(fullPlan, days, missing).ok).toBe(false)
  })

  it("lets a pick-your-days plan apply to the days the attendee filled", () => {
    const weekend: PlanRule = { ...fullPlan, coversAllDays: false, discountPercent: 8 }
    const oneDay: PricedSlot[] = [
      { dateKey: "2026-12-27", periodId: "morning", lines: [{ quantity: 1, unitPriceKobo: 350000 }] },
      { dateKey: "2026-12-27", periodId: "evening", lines: [{ quantity: 1, unitPriceKobo: 650000 }] },
    ]
    expect(selectionSatisfiesPlan(weekend, days, oneDay).ok).toBe(true)
  })
})

describe("pricing", () => {
  const slots: PricedSlot[] = [
    { dateKey: "2026-12-27", periodId: "morning", lines: [{ quantity: 2, unitPriceKobo: 350000 }] },
  ]

  it("snapshots a line total from quantity and unit price", () => {
    const quote = quoteTotals(slots, null, false)
    expect(quote.subtotalKobo).toBe(700000)
    expect(quote.discountKobo).toBe(0)
    expect(quote.totalKobo).toBe(700000)
  })

  it("takes a percent off only when the plan applies", () => {
    const plan: PlanRule = {
      coversAllDays: false,
      periodIds: ["morning"],
      pricingMode: "PERCENT_DISCOUNT",
      fixedPricePerSlotKobo: null,
      discountPercent: 10,
    }
    const applied = quoteTotals(slots, plan, true)
    expect(applied.discountKobo).toBe(70000)
    expect(applied.totalKobo).toBe(630000)
    const skipped = quoteTotals(slots, plan, false)
    expect(skipped.totalKobo).toBe(700000)
  })

  it("replaces menu prices with a fixed price per slot", () => {
    const plan: PlanRule = {
      coversAllDays: false,
      periodIds: ["morning"],
      pricingMode: "FIXED_PER_SLOT",
      fixedPricePerSlotKobo: 500000,
      discountPercent: null,
    }
    const quote = quoteTotals(slots, plan, true)
    expect(quote.subtotalKobo).toBe(500000)
    expect(quote.totalKobo).toBe(500000)
  })

  it("shows a from-price per day for a percent plan", () => {
    const prices = planFromPrices(fullPlan, 2, { morning: 350000, evening: 650000 })
    expect(prices.perDayKobo).toBe(900000)
    expect(prices.totalKobo).toBe(1800000)
  })
})
