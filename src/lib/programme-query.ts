import type { Prisma } from "@prisma/client"
import { LISTED_PROGRAMME_STATUSES } from "@/lib/domain"

export function programmeListWhere(input: { q?: string }): Prisma.ProgrammeWhereInput {
  const and: Prisma.ProgrammeWhereInput[] = [
    { status: { in: [...LISTED_PROGRAMME_STATUSES] } },
  ]
  const q = input.q?.trim()
  if (q) {
    and.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { code: { contains: q, mode: "insensitive" } },
        { church: { name: { contains: q, mode: "insensitive" } } },
        { venue: { name: { contains: q, mode: "insensitive" } } },
      ],
    })
  }
  return { AND: and }
}

export function startingPriceKobo(
  offerings: { priceKoboOverride: number | null; variant: { priceKobo: number } }[],
) {
  if (offerings.length === 0) return null
  return Math.min(
    ...offerings.map((offering) => offering.priceKoboOverride ?? offering.variant.priceKobo),
  )
}
