import {
  quoteTotals,
  selectionSatisfiesPlan,
  type PlanRule,
  type PricedSlot,
} from "@/lib/ordering/rules"

export type CheckoutLine = {
  variantId: string
  nameSnapshot: string
  quantity: number
  unitPriceKobo: number
}

export type CheckoutSlot = {
  mealSlotId: string
  dateKey: string
  periodId: string
  lines: CheckoutLine[]
}

/** Prices come from the lines passed in (loaded from the database). `clientTotalKobo` is ignored. */
export function priceCheckout(input: {
  clientTotalKobo: number
  programmeDateKeys: string[]
  plan: PlanRule | null
  slots: CheckoutSlot[]
}) {
  const priced: PricedSlot[] = input.slots.map((slot) => ({
    dateKey: slot.dateKey,
    periodId: slot.periodId,
    lines: slot.lines.map((line) => ({ quantity: line.quantity, unitPriceKobo: line.unitPriceKobo })),
  }))
  const satisfied = input.plan
    ? selectionSatisfiesPlan(input.plan, input.programmeDateKeys, priced)
    : { ok: false, message: "" }
  const money = quoteTotals(priced, input.plan, satisfied.ok)
  return {
    ...money,
    planApplied: Boolean(input.plan && satisfied.ok),
    planMessage: input.plan ? satisfied.message : "",
    slots: input.slots,
  }
}
