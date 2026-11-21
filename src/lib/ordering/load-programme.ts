import "server-only"

import { connection } from "next/server"
import { prisma } from "@/lib/prisma"
import { formatDayLabel } from "@/lib/dates"
import {
  deliveryStartFromKey,
  holdsCapacity,
  lagosDateKey,
  planFromPrices,
  slotAvailability,
} from "@/lib/ordering/rules"
import type { OrderingItem, OrderingProgramme, OrderingSlot } from "@/lib/ordering/types"

const REASON: Record<OrderingSlot["state"], string> = {
  open: "Open",
  ordering_closed: "Ordering closed",
  sold_out: "Sold out",
  not_served: "Not served",
  programme_closed: "Ordering closed",
}

export async function loadOrderingProgramme(slug: string): Promise<OrderingProgramme | null> {
  await connection()
  const now = new Date()
  const programme = await prisma.programme.findUnique({
    where: { slug },
    include: {
      church: true,
      venue: true,
      mealPeriods: { orderBy: { position: "asc" } },
      mealPlans: {
        where: { isActive: true, archivedAt: null },
        orderBy: { position: "asc" },
        include: { periods: true },
      },
      slots: { include: { mealPeriod: true }, orderBy: [{ date: "asc" }] },
      menuItems: {
        where: {
          isActive: true,
          variant: { isAvailable: true, menuItem: { isActive: true, archivedAt: null, category: { isActive: true, archivedAt: null } } },
        },
        include: {
          periods: true,
          variant: { include: { menuItem: { include: { category: true } } } },
        },
      },
    },
  })
  if (!programme || programme.status === "DRAFT" || programme.status === "ARCHIVED") return null

  const holds = await prisma.orderSlot.findMany({
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
    select: { mealSlotId: true, order: { select: { status: true, createdAt: true } } },
  })
  const heldBySlot = new Map<string, number>()
  for (const hold of holds) {
    if (!holdsCapacity(hold.order.status, hold.order.createdAt, now)) continue
    heldBySlot.set(hold.mealSlotId, (heldBySlot.get(hold.mealSlotId) ?? 0) + 1)
  }

  const periodIdsWithMenu = new Set(programme.menuItems.flatMap((item) => item.periods.map((period) => period.mealPeriodId)))
  const slots: OrderingSlot[] = programme.slots.map((slot) => {
    const dateKey = lagosDateKey(slot.date)
    const deliveryStart = deliveryStartFromKey(dateKey, slot.mealPeriod.deliveryWindowStart)
    const state = slotAvailability({
      programmeStatus: programme.status,
      isOpen: slot.isOpen,
      hasMenu: periodIdsWithMenu.has(slot.mealPeriodId),
      now,
      deliveryStart,
      cutoffHours: programme.orderCutoffHours,
      capacity: slot.capacity,
      held: heldBySlot.get(slot.id) ?? 0,
    })
    return {
      id: slot.id,
      dateKey,
      label: formatDayLabel(slot.date),
      periodId: slot.mealPeriodId,
      periodName: slot.mealPeriod.name,
      windowStart: slot.mealPeriod.deliveryWindowStart,
      windowEnd: slot.mealPeriod.deliveryWindowEnd,
      cutoffAt: deliveryStartFromKey(dateKey, slot.mealPeriod.deliveryWindowStart).toISOString(),
      state,
      reason: REASON[state],
    }
  })
  // cutoffAt above is delivery start; the displayed cutoff is delivery start minus hours.
  for (const slot of slots) {
    const start = new Date(slot.cutoffAt)
    slot.cutoffAt = new Date(start.getTime() - programme.orderCutoffHours * 60 * 60 * 1000).toISOString()
  }

  const menuMap = new Map<string, OrderingItem>()
  for (const offering of programme.menuItems) {
    const item = offering.variant.menuItem
    const current = menuMap.get(item.id) ?? {
      id: item.id,
      name: item.name,
      description: item.description,
      imageUrl: item.imageUrl,
      dietaryTags: item.dietaryTags,
      categoryName: item.category.name,
      categoryPosition: item.category.position,
      position: item.position,
      variants: [],
    }
    current.variants.push({
      id: offering.variant.id,
      name: offering.variant.name,
      priceKobo: offering.priceKoboOverride ?? offering.variant.priceKobo,
      servesCount: offering.variant.servesCount,
      periodIds: offering.periods.map((period) => period.mealPeriodId),
    })
    menuMap.set(item.id, current)
  }
  const menu = [...menuMap.values()].sort((a, b) => a.categoryPosition - b.categoryPosition || a.position - b.position)
  for (const item of menu) item.variants.sort((a, b) => a.priceKobo - b.priceKobo)

  const dateKeys = [...new Set(slots.map((slot) => slot.dateKey))]
  const minByPeriod: Record<string, number> = {}
  for (const item of menu) {
    for (const variant of item.variants) {
      for (const periodId of variant.periodIds) {
        minByPeriod[periodId] = Math.min(minByPeriod[periodId] ?? variant.priceKobo, variant.priceKobo)
      }
    }
  }

  return {
    id: programme.id,
    slug: programme.slug,
    code: programme.code,
    title: programme.title,
    description: programme.description,
    coverImageUrl: programme.coverImageUrl,
    churchName: programme.church.name,
    churchLogoUrl: programme.church.logoUrl,
    venueName: programme.venue.name,
    venueAddress: programme.venue.address,
    venueNotes: programme.venue.notes,
    lat: programme.venue.lat,
    lng: programme.venue.lng,
    status: programme.status,
    dateKeys,
    periods: programme.mealPeriods.map((period) => ({
      id: period.id,
      name: period.name,
      start: period.deliveryWindowStart,
      end: period.deliveryWindowEnd,
    })),
    slots,
    plans: programme.mealPlans.map((plan) => {
      const rule = {
        coversAllDays: plan.coversAllDays,
        periodIds: plan.periods.map((period) => period.mealPeriodId),
        pricingMode: plan.pricingMode,
        fixedPricePerSlotKobo: plan.fixedPricePerSlotKobo,
        discountPercent: plan.discountPercent,
      }
      const prices = planFromPrices(rule, dateKeys.length, minByPeriod)
      return {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        ...rule,
        isPopular: plan.isPopular,
        perDayKobo: prices.perDayKobo,
        totalKobo: prices.totalKobo,
      }
    }),
    menu,
  }
}
