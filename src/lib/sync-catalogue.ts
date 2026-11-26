import type { Prisma, PrismaClient } from "@prisma/client"
import {
  DEFAULT_SLOT_CAPACITY,
  MENU_CATEGORIES,
  MENU_ITEMS,
  ORDER_CUTOFF_HOURS,
  PROGRAMMES,
  SERVICE_WINDOWS,
  periodsFor,
  portionsFor,
  type CatalogueProgramme,
} from "@/lib/catalogue"
import { eachDay, utcDate } from "@/lib/calendar"
import { cutoffInstant, deliveryStartFromKey } from "@/lib/ordering/rules"

type Db = PrismaClient | Prisma.TransactionClient

export type ContentSummary = {
  mode: "insert-only"
  createdCategories: number
  createdMenuItems: number
  createdVariants: number
  createdProgrammes: string[]
  createdSlots: number
  skippedMenuItems: number
  skippedProgrammes: string[]
}

async function ensureVenue(db: Db, programme: CatalogueProgramme) {
  const venue = programme.venue
  const existing =
    (await db.venue.findFirst({ where: { placeId: venue.key } })) ??
    (await db.venue.findFirst({ where: { name: venue.name } }))
  const saved =
    existing ??
    (await db.venue.create({
      data: {
        name: venue.name,
        address: venue.address,
        notes: venue.notes,
        placeId: venue.key,
      },
    }))
  const point = await db.deliveryPoint.findFirst({
    where: { venueId: saved.id, name: venue.pointName },
  })
  if (!point) {
    await db.deliveryPoint.create({
      data: {
        venueId: saved.id,
        name: venue.pointName,
        description: venue.pointDescription,
        position: 0,
      },
    })
  }
  return saved
}

/**
 * Inserts catalogue rows that are not in the database yet.
 * Existing dishes, prices, photos, programmes and admin-created rows are left untouched.
 */
export async function syncCatalogue(db: Db): Promise<ContentSummary> {
  const summary: ContentSummary = {
    mode: "insert-only",
    createdCategories: 0,
    createdMenuItems: 0,
    createdVariants: 0,
    createdProgrammes: [],
    createdSlots: 0,
    skippedMenuItems: 0,
    skippedProgrammes: [],
  }

  for (const category of MENU_CATEGORIES) {
    const existing = await db.category.findUnique({ where: { slug: category.slug } })
    if (existing) continue
    await db.category.create({ data: { ...category, isActive: true } })
    summary.createdCategories += 1
  }

  const variantIds = new Map<string, string[]>()
  for (const [index, item] of MENU_ITEMS.entries()) {
    const portions = portionsFor(item)
    const existing = await db.menuItem.findUnique({
      where: { slug: item.slug },
      include: { variants: true },
    })
    if (existing) {
      const ids = existing.variants.filter((variant) => portions.some((portion) => portion.name === variant.name)).map((variant) => variant.id)
      for (const portion of portions) {
        if (existing.variants.some((variant) => variant.name === portion.name)) continue
        const created = await db.menuItemVariant.create({
          data: {
            menuItemId: existing.id,
            name: portion.name,
            priceKobo: portion.priceKobo,
            servesCount: 1,
            prepMinutes: item.category === "extras" ? 15 : 35,
            isAvailable: true,
            position: portion.position,
          },
        })
        ids.push(created.id)
        summary.createdVariants += 1
      }
      variantIds.set(item.slug, ids)
      summary.skippedMenuItems += 1
      continue
    }

    const category = await db.category.findUniqueOrThrow({ where: { slug: item.category } })
    const saved = await db.menuItem.create({
      data: {
        slug: item.slug,
        name: item.name,
        description: item.description,
        imageUrl: item.imageUrl,
        dietaryTags: item.tags,
        position: index,
        isActive: true,
        categoryId: category.id,
      },
    })
    const ids: string[] = []
    for (const portion of portions) {
      const variant = await db.menuItemVariant.create({
        data: {
          menuItemId: saved.id,
          name: portion.name,
          priceKobo: portion.priceKobo,
          servesCount: 1,
          prepMinutes: item.category === "extras" ? 15 : 35,
          isAvailable: true,
          position: portion.position,
        },
      })
      ids.push(variant.id)
    }
    variantIds.set(item.slug, ids)
    summary.createdMenuItems += 1
  }

  for (const spec of PROGRAMMES) {
    const existingProgramme = await db.programme.findUnique({ where: { code: spec.code } })
    if (existingProgramme) {
      summary.skippedProgrammes.push(spec.code)
      continue
    }

    const church =
      (await db.church.findUnique({ where: { slug: spec.church.slug } })) ??
      (await db.church.create({
        data: {
          name: spec.church.name,
          slug: spec.church.slug,
          contactPhone: spec.church.contactPhone,
          contactEmail: spec.church.contactEmail,
        },
      }))
    const venue = await ensureVenue(db, spec)
    const start = utcDate(spec.startDate)
    const end = utcDate(spec.endDate)
    if (!start || !end) continue
    const programme = await db.programme.create({
      data: {
        churchId: church.id,
        venueId: venue.id,
        title: spec.title,
        slug: spec.slug,
        code: spec.code,
        description: spec.description,
        coverImageUrl: spec.coverImageUrl,
        startDate: start,
        endDate: end,
        status: "PUBLISHED",
        orderCutoffHours: ORDER_CUTOFF_HOURS,
        maxOrdersPerSlot: DEFAULT_SLOT_CAPACITY,
      },
    })

    const periodIds = new Map<string, string>()
    for (const window of SERVICE_WINDOWS) {
      const period = await db.mealPeriod.create({
        data: {
          programmeId: programme.id,
          name: window.name,
          deliveryWindowStart: window.start,
          deliveryWindowEnd: window.end,
          position: window.position,
        },
      })
      periodIds.set(window.name, period.id)
    }

    const days = eachDay(spec.startDate, spec.endDate)
    for (const day of days) {
      for (const window of SERVICE_WINDOWS) {
        const mealPeriodId = periodIds.get(window.name)!
        await db.mealSlot.create({
          data: {
            programmeId: programme.id,
            mealPeriodId,
            date: utcDate(day)!,
            capacity: DEFAULT_SLOT_CAPACITY,
            isOpen: true,
            cutoffAt: cutoffInstant(deliveryStartFromKey(day, window.start), ORDER_CUTOFF_HOURS),
          },
        })
        summary.createdSlots += 1
      }
    }

    for (const item of MENU_ITEMS) {
      const wantedPeriods = periodsFor(item).map((name) => periodIds.get(name)!).filter(Boolean)
      for (const variantId of variantIds.get(item.slug) ?? []) {
        const offering = await db.programmeMenuItem.create({
          data: { programmeId: programme.id, variantId, isActive: true },
        })
        for (const mealPeriodId of wantedPeriods) {
          await db.programmeMenuItemPeriod.create({
            data: { programmeMenuItemId: offering.id, mealPeriodId },
          })
        }
      }
    }

    summary.createdProgrammes.push(spec.code)
  }

  return summary
}
