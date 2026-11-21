import { fromZonedTime, formatInTimeZone } from "date-fns-tz"

export const LAGOS = "Africa/Lagos"
export const PENDING_HOLD_MS = 30 * 60 * 1000
export const VENUE_DELIVERY_FEE_KOBO = 0
export const SERVICE_FEE_KOBO = 0

export type SlotState = "open" | "ordering_closed" | "sold_out" | "not_served" | "programme_closed"

export type PlanPricingMode = "FIXED_PER_SLOT" | "PERCENT_DISCOUNT"

export type PlanRule = {
  coversAllDays: boolean
  periodIds: string[]
  pricingMode: PlanPricingMode
  fixedPricePerSlotKobo: number | null
  discountPercent: number | null
}

export type PricedLine = {
  quantity: number
  unitPriceKobo: number
}

export type PricedSlot = {
  dateKey: string
  periodId: string
  lines: PricedLine[]
}

export function lagosDateKey(date: Date) {
  return formatInTimeZone(date, LAGOS, "yyyy-MM-dd")
}

export function deliveryStartFromKey(dateKey: string, windowStart: string) {
  return fromZonedTime(`${dateKey}T${windowStart}:00`, LAGOS)
}

export function holdsCapacity(status: string, createdAt: Date, now: Date) {
  if (status === "PAID" || status === "PARTIALLY_FULFILLED" || status === "FULFILLED") return true
  if (status === "PENDING_PAYMENT") return now.getTime() - createdAt.getTime() < PENDING_HOLD_MS
  return false
}

export function slotAvailability(input: {
  programmeStatus: string
  isOpen: boolean
  hasMenu: boolean
  now: Date
  deliveryStart: Date
  cutoffHours: number
  capacity: number | null
  held: number
}): SlotState {
  if (!input.hasMenu) return "not_served"
  if (input.programmeStatus !== "PUBLISHED") return "programme_closed"
  if (!input.isOpen) return "ordering_closed"
  const cutoff = input.deliveryStart.getTime() - input.cutoffHours * 60 * 60 * 1000
  if (!(input.now.getTime() < cutoff)) return "ordering_closed"
  if (input.capacity !== null && input.held >= input.capacity) return "sold_out"
  return "open"
}

export function filledSlots(slots: PricedSlot[]) {
  return slots.filter((slot) => slot.lines.some((line) => line.quantity > 0))
}

export function alaCarteSubtotal(slots: PricedSlot[]) {
  return slots.reduce(
    (sum, slot) => sum + slot.lines.reduce((lineSum, line) => lineSum + line.quantity * line.unitPriceKobo, 0),
    0,
  )
}

export function selectionSatisfiesPlan(
  plan: PlanRule,
  programmeDateKeys: string[],
  slots: PricedSlot[],
): { ok: boolean; message: string } {
  if (plan.periodIds.length === 0) {
    return { ok: false, message: "This plan has no meal periods, so menu prices apply." }
  }
  const filled = filledSlots(slots)
  if (filled.length === 0) {
    return { ok: false, message: "Add a meal before this plan can apply." }
  }
  const allowed = new Set(plan.periodIds)
  if (filled.some((slot) => !allowed.has(slot.periodId))) {
    return { ok: false, message: "A chosen slot sits outside this plan, so menu prices apply." }
  }
  const days = plan.coversAllDays ? programmeDateKeys : [...new Set(filled.map((slot) => slot.dateKey))]
  for (const day of days) {
    for (const periodId of plan.periodIds) {
      const match = filled.find((slot) => slot.dateKey === day && slot.periodId === periodId)
      if (!match) {
        return {
          ok: false,
          message: plan.coversAllDays
            ? "This plan needs every covered meal on every programme day. Menu prices apply until then."
            : "Each day you pick needs every meal in the plan. Menu prices apply until then.",
        }
      }
    }
  }
  return { ok: true, message: "Plan price applied." }
}

export function quoteTotals(
  slots: PricedSlot[],
  plan: PlanRule | null,
  satisfied: boolean,
  fees: { deliveryFeeKobo: number; serviceFeeKobo: number } = {
    deliveryFeeKobo: VENUE_DELIVERY_FEE_KOBO,
    serviceFeeKobo: SERVICE_FEE_KOBO,
  },
) {
  const menuSubtotal = alaCarteSubtotal(slots)
  const filled = filledSlots(slots)
  let subtotalKobo = menuSubtotal
  let discountKobo = 0
  let pricedByPlan = false

  if (plan && satisfied && filled.length > 0) {
    if (plan.pricingMode === "PERCENT_DISCOUNT" && plan.discountPercent) {
      discountKobo = Math.round((menuSubtotal * plan.discountPercent) / 100)
      pricedByPlan = true
    } else if (plan.pricingMode === "FIXED_PER_SLOT" && plan.fixedPricePerSlotKobo !== null) {
      subtotalKobo = filled.length * plan.fixedPricePerSlotKobo
      discountKobo = 0
      pricedByPlan = true
    }
  }

  const totalKobo = Math.max(0, subtotalKobo - discountKobo + fees.deliveryFeeKobo + fees.serviceFeeKobo)
  return {
    subtotalKobo,
    discountKobo,
    deliveryFeeKobo: fees.deliveryFeeKobo,
    serviceFeeKobo: fees.serviceFeeKobo,
    totalKobo,
    pricedByPlan,
  }
}

export function planFromPrices(
  plan: PlanRule,
  dayCount: number,
  minPriceByPeriod: Record<string, number>,
) {
  const menuPerDay = plan.periodIds.reduce((sum, periodId) => sum + (minPriceByPeriod[periodId] ?? 0), 0)
  let perDayKobo = menuPerDay
  if (plan.pricingMode === "PERCENT_DISCOUNT" && plan.discountPercent) {
    perDayKobo = Math.round((menuPerDay * (100 - plan.discountPercent)) / 100)
  }
  if (plan.pricingMode === "FIXED_PER_SLOT" && plan.fixedPricePerSlotKobo !== null) {
    perDayKobo = plan.fixedPricePerSlotKobo * plan.periodIds.length
  }
  return {
    perDayKobo,
    totalKobo: plan.coversAllDays ? perDayKobo * dayCount : null,
  }
}
