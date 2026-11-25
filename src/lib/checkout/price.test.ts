import { describe, expect, it } from "vitest"
import { priceCheckout } from "@/lib/checkout/price"
import type { PlanRule } from "@/lib/ordering/rules"

const days = ["2026-12-27", "2026-12-28"]

function slot(dateKey: string, periodId: string, unitPriceKobo: number) {
  return {
    mealSlotId: `${dateKey}-${periodId}`,
    dateKey,
    periodId,
    lines: [
      {
        variantId: "akara",
        nameSnapshot: "Akara & Pap · Regular",
        variantLabelSnapshot: "Regular",
        quantity: 1,
        unitPriceKobo,
      },
    ],
  }
}

const percent: PlanRule = {
  coversAllDays: false,
  periodIds: ["morning"],
  pricingMode: "PERCENT_DISCOUNT",
  fixedPricePerSlotKobo: null,
  discountPercent: 10,
}

describe("priceCheckout", () => {
  it("charges database unit prices and ignores the client total", () => {
    const quote = priceCheckout({
      clientTotalKobo: 1,
      programmeDateKeys: days,
      plan: null,
      slots: [slot("2026-12-27", "morning", 350_000), slot("2026-12-28", "morning", 350_000)],
    })
    expect(quote.totalKobo).toBe(700_000)
    expect(quote.subtotalKobo).toBe(700_000)
    expect(quote.discountKobo).toBe(0)
    expect(quote.slots[0]?.lines[0]?.nameSnapshot).toBe("Akara & Pap · Regular")
    expect(quote.slots[0]?.lines[0]?.variantLabelSnapshot).toBe("Regular")
    expect(quote.slots[0]?.lines[0]?.unitPriceKobo).toBe(350_000)
  })

  it("applies a percent plan only when the selection still qualifies", () => {
    const quote = priceCheckout({
      clientTotalKobo: 0,
      programmeDateKeys: days,
      plan: percent,
      slots: [slot("2026-12-27", "morning", 350_000)],
    })
    expect(quote.planApplied).toBe(true)
    expect(quote.discountKobo).toBe(35_000)
    expect(quote.totalKobo).toBe(315_000)
  })

  it("falls back to menu prices when a plan is no longer satisfied", () => {
    const quote = priceCheckout({
      clientTotalKobo: 0,
      programmeDateKeys: days,
      plan: { ...percent, periodIds: ["morning", "evening"] },
      slots: [slot("2026-12-27", "morning", 350_000)],
    })
    expect(quote.planApplied).toBe(false)
    expect(quote.totalKobo).toBe(350_000)
    expect(quote.planMessage).toMatch(/Menu prices apply/)
  })

  it("uses the fixed slot price instead of the menu total", () => {
    const quote = priceCheckout({
      clientTotalKobo: 999_999,
      programmeDateKeys: days,
      plan: {
        coversAllDays: false,
        periodIds: ["morning"],
        pricingMode: "FIXED_PER_SLOT",
        fixedPricePerSlotKobo: 300_000,
        discountPercent: null,
      },
      slots: [slot("2026-12-27", "morning", 350_000), slot("2026-12-28", "morning", 350_000)],
    })
    expect(quote.planApplied).toBe(true)
    expect(quote.subtotalKobo).toBe(600_000)
    expect(quote.totalKobo).toBe(600_000)
  })
})
