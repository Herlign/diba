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
import { cutoffInstant, deliveryStartFromKey } from "@/lib/ordering/rules"

type Db = PrismaClient | Prisma.TransactionClient

export type ContentSummary = {
  menuItems: number
  programmes: string[]
  slotsUpserted: number
  slotsClosed: number
  slotsRemoved: number
  archivedMenuItems: number
  archivedCategories: number
  archivedProgrammes: string[]
  deactivatedPromos: number
}

function utcDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number)
  return new Date(Date.UTC(year!, month! - 1, day))
}

function dateKey(date: Date) {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function eachDay(start: string, end: string) {
  const days: string[] = []
  let cursor = utcDate(start).getTime()
  const last = utcDate(end).getTime()
  while (cursor <= last) {
    days.push(dateKey(new Date(cursor)))
    cursor += 24 * 60 * 60 * 1000
  }
  return days
}

async function ensureVenue(db: Db, programme: CatalogueProgramme) {
  const venue = programme.venue
  const existing =
    (await db.venue.findFirst({ where: { placeId: venue.key } })) ??
    (await db.venue.findFirst({ where: { name: venue.name } }))
  const saved = existing
    ? await db.venue.update({
        where: { id: existing.id },
        data: {
          name: venue.name,
          address: venue.address,
          notes: venue.notes,
          placeId: existing.placeId && !existing.placeId.startsWith("diba:") ? existing.placeId : venue.key,
        },
      })
    : await db.venue.create({
        data: {
          name: venue.name,
          address: venue.address,
          notes: venue.notes,
          placeId: venue.key,
        },
      })
  const point = await db.deliveryPoint.findFirst({
    where: { venueId: saved.id, name: venue.pointName },
  })
  if (point) {
    await db.deliveryPoint.update({
      where: { id: point.id },
      data: { description: venue.pointDescription, isActive: true },
    })
  } else {
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

/** Upserts the live menu and programmes, then archives replaced rows. Does not touch staff or orders. */
export async function syncCatalogue(db: Db): Promise<ContentSummary> {
  const summary: ContentSummary = {
    menuItems: 0,
    programmes: [],
    slotsUpserted: 0,
    slotsClosed: 0,
    slotsRemoved: 0,
    archivedMenuItems: 0,
    archivedCategories: 0,
    archivedProgrammes: [],
    deactivatedPromos: 0,
  }
  const now = new Date()

  for (const category of MENU_CATEGORIES) {
    await db.category.upsert({
      where: { slug: category.slug },
      create: { ...category, isActive: true },
      update: { name: category.name, position: category.position, isActive: true, archivedAt: null },
    })
  }

  const variantIds = new Map<string, string[]>()
  for (const [index, item] of MENU_ITEMS.entries()) {
    const category = await db.category.findUniqueOrThrow({ where: { slug: item.category } })
    const saved = await db.menuItem.upsert({
      where: { slug: item.slug },
      create: {
        slug: item.slug,
        name: item.name,
        description: item.description,
        imageUrl: item.imageUrl,
        dietaryTags: item.tags,
        position: index,
        isActive: true,
        categoryId: category.id,
      },
      update: {
        name: item.name,
        description: item.description,
        imageUrl: item.imageUrl,
        dietaryTags: item.tags,
        position: index,
        isActive: true,
        archivedAt: null,
        categoryId: category.id,
      },
    })
    const portions = portionsFor(item)
    const ids: string[] = []
    for (const portion of portions) {
      const variant = await db.menuItemVariant.upsert({
        where: { menuItemId_name: { menuItemId: saved.id, name: portion.name } },
        create: {
          menuItemId: saved.id,
          name: portion.name,
          priceKobo: portion.priceKobo,
          servesCount: 1,
          prepMinutes: item.category === "extras" ? 15 : 35,
          isAvailable: true,
          position: portion.position,
        },
        update: {
          priceKobo: portion.priceKobo,
          isAvailable: true,
          position: portion.position,
          prepMinutes: item.category === "extras" ? 15 : 35,
        },
      })
      ids.push(variant.id)
    }
    await db.menuItemVariant.updateMany({
      where: { menuItemId: saved.id, name: { notIn: portions.map((portion) => portion.name) } },
      data: { isAvailable: false },
    })
    variantIds.set(item.slug, ids)
    summary.menuItems += 1
  }

  const liveVariantIds = [...variantIds.values()].flat()
  for (const spec of PROGRAMMES) {
    const church = await db.church.upsert({
      where: { slug: spec.church.slug },
      create: {
        name: spec.church.name,
        slug: spec.church.slug,
        contactPhone: spec.church.contactPhone,
        contactEmail: spec.church.contactEmail,
      },
      update: { name: spec.church.name, isActive: true },
    })
    const venue = await ensureVenue(db, spec)
    const programme = await db.programme.upsert({
      where: { code: spec.code },
      create: {
        churchId: church.id,
        venueId: venue.id,
        title: spec.title,
        slug: spec.slug,
        code: spec.code,
        description: spec.description,
        coverImageUrl: spec.coverImageUrl,
        startDate: utcDate(spec.startDate),
        endDate: utcDate(spec.endDate),
        status: "PUBLISHED",
        orderCutoffHours: ORDER_CUTOFF_HOURS,
        maxOrdersPerSlot: DEFAULT_SLOT_CAPACITY,
      },
      update: {
        churchId: church.id,
        venueId: venue.id,
        title: spec.title,
        slug: spec.slug,
        description: spec.description,
        coverImageUrl: spec.coverImageUrl,
        startDate: utcDate(spec.startDate),
        endDate: utcDate(spec.endDate),
        status: "PUBLISHED",
        orderCutoffHours: ORDER_CUTOFF_HOURS,
      },
    })

    const periodIds = new Map<string, string>()
    for (const window of SERVICE_WINDOWS) {
      const period = await db.mealPeriod.upsert({
        where: { programmeId_name: { programmeId: programme.id, name: window.name } },
        create: {
          programmeId: programme.id,
          name: window.name,
          deliveryWindowStart: window.start,
          deliveryWindowEnd: window.end,
          position: window.position,
        },
        update: {
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
        await db.mealSlot.upsert({
          where: {
            programmeId_mealPeriodId_date: {
              programmeId: programme.id,
              mealPeriodId,
              date: utcDate(day),
            },
          },
          create: {
            programmeId: programme.id,
            mealPeriodId,
            date: utcDate(day),
            capacity: DEFAULT_SLOT_CAPACITY,
            isOpen: true,
            cutoffAt: cutoffInstant(deliveryStartFromKey(day, window.start), ORDER_CUTOFF_HOURS),
          },
          update: {
            cutoffAt: cutoffInstant(deliveryStartFromKey(day, window.start), ORDER_CUTOFF_HOURS),
          },
        })
        summary.slotsUpserted += 1
      }
    }

    const wantedDays = new Set(days)
    const existingSlots = await db.mealSlot.findMany({
      where: { programmeId: programme.id },
      include: { _count: { select: { orderSlots: true } } },
    })
    for (const slot of existingSlots) {
      if (wantedDays.has(dateKey(slot.date))) continue
      if (slot._count.orderSlots > 0) {
        if (slot.isOpen) {
          await db.mealSlot.update({ where: { id: slot.id }, data: { isOpen: false } })
          summary.slotsClosed += 1
        }
        continue
      }
      await db.mealSlot.delete({ where: { id: slot.id } })
      summary.slotsRemoved += 1
    }

    for (const item of MENU_ITEMS) {
      const wantedPeriods = new Set(periodsFor(item).map((name) => periodIds.get(name)!))
      for (const variantId of variantIds.get(item.slug) ?? []) {
        const offering = await db.programmeMenuItem.upsert({
          where: { programmeId_variantId: { programmeId: programme.id, variantId } },
          create: { programmeId: programme.id, variantId, isActive: true },
          update: { isActive: true, priceKoboOverride: null },
        })
        const links = await db.programmeMenuItemPeriod.findMany({
          where: { programmeMenuItemId: offering.id },
        })
        for (const link of links) {
          if (!wantedPeriods.has(link.mealPeriodId)) {
            await db.programmeMenuItemPeriod.delete({ where: { id: link.id } })
          }
        }
        for (const mealPeriodId of wantedPeriods) {
          await db.programmeMenuItemPeriod.upsert({
            where: {
              programmeMenuItemId_mealPeriodId: {
                programmeMenuItemId: offering.id,
                mealPeriodId,
              },
            },
            create: { programmeMenuItemId: offering.id, mealPeriodId },
            update: {},
          })
        }
      }
    }

    await db.programmeMenuItem.updateMany({
      where: { programmeId: programme.id, variantId: { notIn: liveVariantIds }, isActive: true },
      data: { isActive: false },
    })
    summary.programmes.push(spec.code)
  }

  const retiredItems = await db.menuItem.findMany({
    where: { slug: { notIn: MENU_ITEMS.map((item) => item.slug) } },
    select: { id: true },
  })
  if (retiredItems.length > 0) {
    const ids = retiredItems.map((item) => item.id)
    const archived = await db.menuItem.updateMany({
      where: { id: { in: ids }, archivedAt: null },
      data: { isActive: false, archivedAt: now },
    })
    await db.menuItemVariant.updateMany({
      where: { menuItemId: { in: ids } },
      data: { isAvailable: false },
    })
    summary.archivedMenuItems = archived.count
  }

  const archivedCategories = await db.category.updateMany({
    where: { slug: { notIn: MENU_CATEGORIES.map((category) => category.slug) }, archivedAt: null },
    data: { isActive: false, archivedAt: now },
  })
  summary.archivedCategories = archivedCategories.count

  const retiredProgrammes = await db.programme.findMany({
    where: { code: { notIn: PROGRAMMES.map((programme) => programme.code) }, status: { not: "ARCHIVED" } },
    select: { id: true, code: true },
  })
  if (retiredProgrammes.length > 0) {
    const ids = retiredProgrammes.map((programme) => programme.id)
    await db.programme.updateMany({
      where: { id: { in: ids } },
      data: { status: "ARCHIVED" },
    })
    const promos = await db.promoCode.updateMany({
      where: { programmeId: { in: ids }, isActive: true },
      data: { isActive: false },
    })
    summary.archivedProgrammes = retiredProgrammes.map((programme) => programme.code)
    summary.deactivatedPromos = promos.count
  }

  return summary
}
