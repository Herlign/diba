import "server-only"

import { ProgrammeStatus } from "@/lib/domain"
import { prisma } from "@/lib/prisma"
import { programmeListWhere, startingPriceKobo } from "@/lib/programme-query"

const programmeInclude = {
  church: true,
  venue: true,
  mealPeriods: { orderBy: { position: "asc" as const } },
  menuItems: {
    where: {
      isActive: true,
      variant: {
        menuItem: { category: { slug: { in: ["breakfast", "rice-dishes", "swallow"] } } },
      },
    },
    include: { variant: { select: { priceKobo: true } } },
  },
}

export type ProgrammeCard = {
  slug: string
  code: string
  title: string
  description: string
  churchName: string
  venueName: string
  startDate: Date
  endDate: Date
  status: string
  coverImageUrl: string | null
  fromKobo: number | null
  periods: { name: string; start: string; end: string }[]
}

function toCard(row: {
  slug: string
  code: string
  title: string
  description: string
  coverImageUrl: string | null
  startDate: Date
  endDate: Date
  status: string
  church: { name: string }
  venue: { name: string }
  mealPeriods: { name: string; deliveryWindowStart: string; deliveryWindowEnd: string }[]
  menuItems: { priceKoboOverride: number | null; variant: { priceKobo: number } }[]
}): ProgrammeCard {
  return {
    slug: row.slug,
    code: row.code,
    title: row.title,
    description: row.description,
    churchName: row.church.name,
    venueName: row.venue.name,
    startDate: row.startDate,
    endDate: row.endDate,
    status: row.status,
    coverImageUrl: row.coverImageUrl,
    fromKobo: startingPriceKobo(row.menuItems),
    periods: row.mealPeriods.map((period) => ({
      name: period.name,
      start: period.deliveryWindowStart,
      end: period.deliveryWindowEnd,
    })),
  }
}

export async function listProgrammes(q?: string): Promise<ProgrammeCard[]> {
  const rows = await prisma.programme.findMany({
    where: programmeListWhere({ q }),
    include: programmeInclude,
    orderBy: { startDate: "asc" },
  })
  return rows.map(toCard)
}

export async function listUpcomingProgrammes(): Promise<ProgrammeCard[]> {
  const rows = await prisma.programme.findMany({
    where: { status: ProgrammeStatus.PUBLISHED },
    include: programmeInclude,
    orderBy: { startDate: "asc" },
  })
  return rows.map(toCard)
}
