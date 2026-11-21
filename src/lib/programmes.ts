import "server-only"

import { connection } from "next/server"
import {
  PUBLIC_PROGRAMME_STATUSES,
  type ListStatusFilter,
} from "@/lib/domain"
import { prisma } from "@/lib/prisma"
import {
  programmeListWhere,
  sortProgrammes,
  type ProgrammeCardSource,
} from "@/lib/programme-query"

export const programmeCardInclude = {
  days: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      slots: {
        orderBy: { sortOrder: "asc" as const },
        include: {
          offerings: {
            where: { isAvailable: true },
            include: {
              menuItem: {
                select: { priceKobo: true, category: true, name: true },
              },
            },
          },
        },
      },
    },
  },
}

export type ProgrammeCard = ProgrammeCardSource & {
  slug: string
  title: string
  ministryName: string
  summary: string
  city: string
  state: string
  venueName: string
  startsOn: Date
  endsOn: Date
  status: string
  accent: string
}

export async function listProgrammes(input: {
  status: ListStatusFilter
  city?: string
  q?: string
}): Promise<ProgrammeCard[]> {
  await connection()
  const now = new Date()
  const rows = await prisma.programme.findMany({
    where: programmeListWhere({ ...input, now }),
    include: programmeCardInclude,
  })
  return sortProgrammes(rows, now)
}

export async function listFeaturedProgrammes(): Promise<ProgrammeCard[]> {
  const rows = await prisma.programme.findMany({
    where: { status: "ORDERING_OPEN" },
    orderBy: { startsOn: "asc" },
    take: 3,
    include: programmeCardInclude,
  })
  return rows
}

export async function listPublicCities(): Promise<string[]> {
  const rows = await prisma.programme.findMany({
    where: { status: { in: PUBLIC_PROGRAMME_STATUSES } },
    select: { city: true },
    distinct: ["city"],
    orderBy: { city: "asc" },
  })
  return rows.map((row) => row.city)
}

export async function catalogueStats() {
  const [programmes, cities, plates] = await Promise.all([
    prisma.programme.count({
      where: { status: { in: PUBLIC_PROGRAMME_STATUSES } },
    }),
    prisma.programme.findMany({
      where: { status: { in: PUBLIC_PROGRAMME_STATUSES } },
      select: { city: true },
      distinct: ["city"],
    }),
    prisma.menuItem.count({ where: { category: "PLATE", isActive: true } }),
  ])
  return {
    programmes,
    cities: cities.length,
    plates,
  }
}
