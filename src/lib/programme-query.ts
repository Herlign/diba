import type { Prisma } from "@prisma/client"
import {
  LIST_STATUS_FILTERS,
  MEAL_LABEL,
  MenuCategory,
  PUBLIC_PROGRAMME_STATUSES,
  ProgrammeStatus,
  type ListStatusFilter,
} from "@/lib/domain"

export type OfferingPrice = {
  priceKoboOverride: number | null
  isAvailable?: boolean
  menuItem: { priceKobo: number; category: string; name?: string }
}

export type ProgrammeCardSource = {
  days: {
    slots: {
      kind: string
      offerings: OfferingPrice[]
    }[]
  }[]
}

const PAST_STATUSES: string[] = [
  ProgrammeStatus.COMPLETED,
  ProgrammeStatus.CANCELLED,
]

export function programmeListWhere(input: {
  status: ListStatusFilter
  city?: string
  q?: string
  now: Date
}): Prisma.ProgrammeWhereInput {
  const and: Prisma.ProgrammeWhereInput[] = [
    { status: { in: PUBLIC_PROGRAMME_STATUSES } },
  ]

  if (input.status === "open") {
    and.push({ status: ProgrammeStatus.ORDERING_OPEN })
  }

  if (input.status === "upcoming") {
    and.push({ endsOn: { gte: input.now } })
    and.push({ status: { notIn: PAST_STATUSES } })
  }

  if (input.status === "past") {
    and.push({
      OR: [
        { status: { in: PAST_STATUSES } },
        { endsOn: { lt: input.now } },
      ],
    })
  }

  if (input.city && input.city !== "all") {
    and.push({ city: input.city })
  }

  const q = input.q?.trim()
  if (q) {
    and.push({
      OR: [
        { title: { contains: q } },
        { ministryName: { contains: q } },
        { city: { contains: q } },
        { venueName: { contains: q } },
      ],
    })
  }

  return { AND: and }
}

export function isKnownStatusFilter(value: string): value is ListStatusFilter {
  return LIST_STATUS_FILTERS.some((item) => item.value === value)
}

function offeringPrice(offering: OfferingPrice): number | null {
  if (offering.isAvailable === false) return null
  if (offering.menuItem.category !== MenuCategory.PLATE) return null
  return offering.priceKoboOverride ?? offering.menuItem.priceKobo
}

export function startingPriceKobo(programme: ProgrammeCardSource): number | null {
  const prices = programme.days.flatMap((day) =>
    day.slots.flatMap((slot) =>
      slot.offerings
        .map(offeringPrice)
        .filter((price): price is number => price !== null),
    ),
  )
  if (prices.length === 0) return null
  return Math.min(...prices)
}

export function mealRhythm(programme: ProgrammeCardSource): string {
  const kinds = new Set(
    programme.days.flatMap((day) => day.slots.map((slot) => slot.kind)),
  )
  const labels = [ "BREAKFAST", "LUNCH", "DINNER" ]
    .filter((kind) => kinds.has(kind))
    .map((kind) => MEAL_LABEL[kind] ?? kind)
  const dayCount = programme.days.length
  const dayLabel = dayCount === 1 ? "1 day" : `${dayCount} days`
  if (labels.length === 0) return dayLabel
  return `${labels.join(" · ")} · ${dayLabel}`
}

export function plateNames(programme: ProgrammeCardSource, limit = 3): string[] {
  const names: string[] = []
  for (const day of programme.days) {
    for (const slot of day.slots) {
      for (const offering of slot.offerings) {
        if (offering.menuItem.category !== MenuCategory.PLATE) continue
        const name = offering.menuItem.name
        if (!name || names.includes(name)) continue
        names.push(name)
        if (names.length >= limit) return names
      }
    }
  }
  return names
}

export function sortProgrammes<T extends { startsOn: Date; endsOn: Date; status: string }>(
  rows: T[],
  now: Date,
): T[] {
  const past = (row: T) =>
    PAST_STATUSES.includes(row.status) || row.endsOn.getTime() < now.getTime()
  return [...rows].sort((a, b) => {
    const aPast = past(a)
    const bPast = past(b)
    if (aPast !== bPast) return aPast ? 1 : -1
    if (aPast && bPast) return b.startsOn.getTime() - a.startsOn.getTime()
    return a.startsOn.getTime() - b.startsOn.getTime()
  })
}
