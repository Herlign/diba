"use server"

import { z } from "zod"
import { connection } from "next/server"
import { prisma } from "@/lib/prisma"
import { formatDayLabel, formatLagosMoment, formatWindow } from "@/lib/dates"
import {
  cutoffInstant,
  deliveryStartFromKey,
  lagosDateKey,
  quoteTotals,
  selectionSatisfiesPlan,
  slotAvailability,
  type PricedSlot,
} from "@/lib/ordering/rules"

const cartSchema = z.object({
  planId: z.string().nullable(),
  slots: z
    .array(
      z.object({
        mealSlotId: z.string().min(1),
        items: z
          .array(
            z.object({
              variantId: z.string().min(1),
              quantity: z.number().int().min(1).max(20),
            }),
          )
          .max(20),
      }),
    )
    .max(40),
})

export type QuoteLine = {
  variantId: string
  name: string
  quantity: number
  unitPriceKobo: number
  lineTotalKobo: number
}

export type QuoteGroup = {
  dateKey: string
  label: string
  periods: {
    mealSlotId: string
    periodName: string
    windowLabel: string
    state: string
    reason: string
    lines: QuoteLine[]
  }[]
}

export type CartQuote = {
  groups: QuoteGroup[]
  planApplied: boolean
  planMessage: string
  subtotalKobo: number
  discountKobo: number
  deliveryFeeKobo: number
  serviceFeeKobo: number
  totalKobo: number
  earliestCutoffLabel: string | null
  dropped: string[]
}

export async function quoteProgrammeCart(slug: string, rawCart: unknown): Promise<CartQuote | null> {
  await connection()
  const parsed = cartSchema.safeParse(rawCart)
  if (!parsed.success) return null
  const now = new Date()
  const programme = await prisma.programme.findUnique({
    where: { slug },
    include: {
      mealPeriods: true,
      mealPlans: { include: { periods: true } },
      slots: { include: { mealPeriod: true } },
      menuItems: { where: { isActive: true }, include: { periods: true, variant: { include: { menuItem: true } } } },
    },
  })
  if (!programme || programme.status === "DRAFT" || programme.status === "ARCHIVED") return null

  const slotById = new Map(programme.slots.map((slot) => [slot.id, slot]))
  const offeringByVariant = new Map(programme.menuItems.map((item) => [item.variantId, item]))
  const heldRows = await prisma.orderSlot.findMany({
    where: {
      mealSlot: { programmeId: programme.id },
      status: { not: "CANCELLED" },
      order: {
        OR: [
          { status: { in: ["PAID", "PARTIALLY_FULFILLED", "FULFILLED"] } },
          { status: "PENDING_PAYMENT", createdAt: { gt: new Date(now.getTime() - 30 * 60 * 1000) } },
        ],
      },
    },
    select: { mealSlotId: true },
  })
  const held = new Map<string, number>()
  for (const row of heldRows) held.set(row.mealSlotId, (held.get(row.mealSlotId) ?? 0) + 1)

  const dropped: string[] = []
  const priced: PricedSlot[] = []
  const groups = new Map<string, QuoteGroup>()
  let earliest: Date | null = null

  for (const entry of parsed.data.slots) {
    const slot = slotById.get(entry.mealSlotId)
    if (!slot) {
      dropped.push("A slot is no longer on this programme.")
      continue
    }
    const dateKey = lagosDateKey(slot.date)
    const deliveryStart = deliveryStartFromKey(dateKey, slot.mealPeriod.deliveryWindowStart)
    const state = slotAvailability({
      programmeStatus: programme.status,
      isOpen: slot.isOpen,
      hasMenu: programme.menuItems.some((item) => item.periods.some((period) => period.mealPeriodId === slot.mealPeriodId)),
      now,
      deliveryStart,
      cutoffHours: programme.orderCutoffHours,
      capacity: slot.capacity,
      held: held.get(slot.id) ?? 0,
    })
    const lines: QuoteLine[] = []
    if (state === "open") {
      for (const item of entry.items) {
        const offering = offeringByVariant.get(item.variantId)
        const offeredHere = offering?.periods.some((period) => period.mealPeriodId === slot.mealPeriodId)
        if (!offering || !offeredHere || !offering.variant.isAvailable) {
          dropped.push("One plate is not served in that slot.")
          continue
        }
        const unitPriceKobo = offering.priceKoboOverride ?? offering.variant.priceKobo
        lines.push({
          variantId: item.variantId,
          name: `${offering.variant.menuItem.name} · ${offering.variant.name}`,
          quantity: item.quantity,
          unitPriceKobo,
          lineTotalKobo: unitPriceKobo * item.quantity,
        })
      }
    } else if (entry.items.length > 0) {
      dropped.push(`${formatDayLabel(slot.date)} ${slot.mealPeriod.name} is ${state === "sold_out" ? "sold out" : "closed"}.`)
    }
    if (lines.length === 0) continue
    const cutoff = cutoffInstant(deliveryStart, programme.orderCutoffHours)
    if (!earliest || cutoff < earliest) earliest = cutoff
    const group = groups.get(dateKey) ?? { dateKey, label: formatDayLabel(slot.date), periods: [] }
    group.periods.push({
      mealSlotId: slot.id,
      periodName: slot.mealPeriod.name,
      windowLabel: formatWindow(slot.mealPeriod.deliveryWindowStart, slot.mealPeriod.deliveryWindowEnd),
      state,
      reason: state === "open" ? "Open" : state === "sold_out" ? "Sold out" : "Ordering closed",
      lines,
    })
    groups.set(dateKey, group)
    priced.push({
      dateKey,
      periodId: slot.mealPeriodId,
      lines: lines.map((line) => ({ quantity: line.quantity, unitPriceKobo: line.unitPriceKobo })),
    })
  }

  const planRecord = parsed.data.planId ? programme.mealPlans.find((plan) => plan.id === parsed.data.planId && plan.isActive) : null
  const plan = planRecord
    ? {
        coversAllDays: planRecord.coversAllDays,
        periodIds: planRecord.periods.map((period) => period.mealPeriodId),
        pricingMode: planRecord.pricingMode,
        fixedPricePerSlotKobo: planRecord.fixedPricePerSlotKobo,
        discountPercent: planRecord.discountPercent,
      }
    : null
  const dateKeys = [...new Set(programme.slots.map((slot) => lagosDateKey(slot.date)))]
  const satisfied = plan ? selectionSatisfiesPlan(plan, dateKeys, priced) : { ok: false, message: "" }
  const money = quoteTotals(priced, plan, satisfied.ok)

  return {
    groups: [...groups.values()].sort((a, b) => a.dateKey.localeCompare(b.dateKey)),
    planApplied: Boolean(plan && satisfied.ok),
    planMessage: plan ? satisfied.message : "",
    ...money,
    earliestCutoffLabel: earliest ? formatLagosMoment(earliest) : null,
    dropped: [...new Set(dropped)],
  }
}
