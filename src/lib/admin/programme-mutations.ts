"use server"

import { prisma } from "@/lib/prisma"
import { DEFAULT_SLOT_CAPACITY, SERVICE_WINDOWS } from "@/lib/catalogue"
import { eachDay, isoDate, utcDate } from "@/lib/calendar"
import { failTo, noticeTo, requireManager } from "@/lib/admin/guard"
import { parseClock } from "@/lib/dates"
import { parseNairaToKobo } from "@/lib/money"
import { revalidatePublic } from "@/lib/admin/revalidate"
import { photoFromForm } from "@/lib/blob-upload"
import { cutoffInstant, deliveryStartFromKey } from "@/lib/ordering/rules"
import { programmeCode, slugify } from "@/lib/slug"

const STATUSES = ["DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"] as const
const PRICE_ERROR = "Enter the special price in naira, such as 1500 or 1,500, or leave it blank to use the menu price."

function touch(id: string, slug: string, code: string) {
  revalidatePublic([`/p/${slug}`, `/c/${code}`, "/admin/programmes", `/admin/programmes/${id}`])
}

function cutoffHoursOf(value: FormDataEntryValue | null) {
  const cutoff = Number(value ?? 24)
  if (!Number.isFinite(cutoff)) return 24
  return Math.min(168, Math.max(1, Math.round(cutoff)))
}

async function refreshCutoffs(programmeId: string, cutoffHours: number) {
  const slots = await prisma.mealSlot.findMany({
    where: { programmeId },
    include: { mealPeriod: true },
  })
  for (const slot of slots) {
    const cutoffAt = cutoffInstant(deliveryStartFromKey(isoDate(slot.date), slot.mealPeriod.deliveryWindowStart), cutoffHours)
    if (slot.cutoffAt.getTime() === cutoffAt.getTime()) continue
    await prisma.mealSlot.update({ where: { id: slot.id }, data: { cutoffAt } })
  }
}

export async function saveProgramme(formData: FormData) {
  await requireManager("/admin/programmes")
  const id = String(formData.get("id") ?? "")
  const title = String(formData.get("title") ?? formData.get("name") ?? "").trim()
  const slug = slugify(String(formData.get("slug") ?? "") || title)
  const code = programmeCode(String(formData.get("code") ?? ""))
  const description = String(formData.get("description") ?? "").trim()
  const churchId = String(formData.get("churchId") ?? "")
  const venueId = String(formData.get("venueId") ?? "")
  const startKey = String(formData.get("startDate") ?? "")
  const endKey = String(formData.get("endDate") ?? "")
  const status = String(formData.get("status") ?? "DRAFT")
  const cutoff = cutoffHoursOf(formData.get("cutoff"))
  const back = id ? `/admin/programmes/${id}` : "/admin/programmes/new"
  if (title.length < 2) failTo(back, "Give the programme a name.")
  if (!slug) failTo(back, "Give the programme a short link.")
  if (code.length < 3) failTo(back, "The short code needs 3 to 16 letters or numbers, like REBOOT26.")
  if (description.length < 10 || description.length > 2000) failTo(back, "Add a short description of the programme.")
  if (!STATUSES.includes(status as (typeof STATUSES)[number])) failTo(back, "Choose a status.")
  const range = { start: utcDate(startKey), end: utcDate(endKey), days: eachDay(startKey, endKey) }
  if (!range.start || !range.end || range.days.length === 0) {
    failTo(back, "Choose a start and end date, at most 31 days apart.")
  }
  const [church, venue, slugClash, codeClash] = await Promise.all([
    prisma.church.findUnique({ where: { id: churchId } }),
    prisma.venue.findUnique({ where: { id: venueId } }),
    prisma.programme.findUnique({ where: { slug } }),
    prisma.programme.findUnique({ where: { code } }),
  ])
  if (!church) failTo(back, "Choose a church.")
  if (!venue) failTo(back, "Choose a venue.")
  if (slugClash && slugClash.id !== id) failTo(back, "That link is already used.")
  if (codeClash && codeClash.id !== id) failTo(back, "That short code is already used.")
  const photo = await photoFromForm(formData, `programmes/${slug}`, String(formData.get("currentImage") ?? ""))
  if (!photo.ok) failTo(back, photo.error)

  if (!id) {
    const periodNames = formData
      .getAll("periods")
      .map((value) => String(value))
      .filter((name) => SERVICE_WINDOWS.some((window) => window.name === name))
    if (periodNames.length === 0) failTo(back, "Choose at least one meal time.")
    const programme = await prisma.programme.create({
      data: {
        churchId,
        venueId,
        title,
        slug,
        code,
        description,
        coverImageUrl: photo.url || "/images/jollof.jpg",
        startDate: range.start,
        endDate: range.end,
        status: status as (typeof STATUSES)[number],
        orderCutoffHours: cutoff,
        maxOrdersPerSlot: DEFAULT_SLOT_CAPACITY,
      },
    })
    const periodIds: string[] = []
    for (const name of periodNames) {
      const window = SERVICE_WINDOWS.find((item) => item.name === name)!
      const period = await prisma.mealPeriod.create({
        data: {
          programmeId: programme.id,
          name: window.name,
          deliveryWindowStart: window.start,
          deliveryWindowEnd: window.end,
          position: window.position,
        },
      })
      periodIds.push(period.id)
      for (const day of range.days) {
        await prisma.mealSlot.create({
          data: {
            programmeId: programme.id,
            mealPeriodId: period.id,
            date: utcDate(day)!,
            capacity: DEFAULT_SLOT_CAPACITY,
            isOpen: true,
            cutoffAt: cutoffInstant(deliveryStartFromKey(day, window.start), cutoff),
          },
        })
      }
    }
    if (formData.get("offerAll") === "on") {
      const variants = await prisma.menuItemVariant.findMany({
        where: { isAvailable: true, menuItem: { isActive: true, archivedAt: null, category: { isActive: true, archivedAt: null } } },
      })
      for (const variant of variants) {
        const offering = await prisma.programmeMenuItem.create({
          data: { programmeId: programme.id, variantId: variant.id, isActive: true },
        })
        for (const mealPeriodId of periodIds) {
          await prisma.programmeMenuItemPeriod.create({
            data: { programmeMenuItemId: offering.id, mealPeriodId },
          })
        }
      }
    }
    touch(programme.id, slug, code)
    const hidden = status === "DRAFT" ? " It stays hidden until you set it to Published." : ""
    noticeTo(`/admin/programmes/${programme.id}`, `${title} added.${photo.notice}${hidden}`)
  }

  const current = await prisma.programme.findUnique({
    where: { id },
    include: { slots: { include: { _count: { select: { orderSlots: true } } } }, mealPeriods: true },
  })
  if (!current) failTo("/admin/programmes", "That programme was not found.")
  const wanted = new Set(range.days)
  let closedDays = 0
  for (const slot of current.slots) {
    if (wanted.has(isoDate(slot.date))) continue
    if (slot._count.orderSlots > 0) {
      if (slot.isOpen) {
        await prisma.mealSlot.update({ where: { id: slot.id }, data: { isOpen: false } })
        closedDays += 1
      }
      continue
    }
    await prisma.mealSlot.delete({ where: { id: slot.id } })
  }
  for (const period of current.mealPeriods) {
    for (const day of range.days) {
      const date = utcDate(day)!
      const existing = await prisma.mealSlot.findUnique({
        where: { programmeId_mealPeriodId_date: { programmeId: id, mealPeriodId: period.id, date } },
      })
      if (existing) continue
      await prisma.mealSlot.create({
        data: {
          programmeId: id,
          mealPeriodId: period.id,
          date,
          capacity: current.maxOrdersPerSlot ?? DEFAULT_SLOT_CAPACITY,
          isOpen: true,
          cutoffAt: cutoffInstant(deliveryStartFromKey(day, period.deliveryWindowStart), cutoff),
        },
      })
    }
  }
  await prisma.programme.update({
    where: { id },
    data: {
      churchId,
      venueId,
      title,
      slug,
      code,
      description,
      coverImageUrl: photo.url || current.coverImageUrl,
      startDate: range.start,
      endDate: range.end,
      status: status as (typeof STATUSES)[number],
      orderCutoffHours: cutoff,
    },
  })
  await refreshCutoffs(id, cutoff)
  touch(id, current.slug, current.code)
  touch(id, slug, code)
  const closedNote = closedDays > 0 ? " Days that already have orders were closed instead of removed." : ""
  noticeTo(`/admin/programmes/${id}`, `Saved.${photo.notice}${closedNote}`)
}

export async function addDay(formData: FormData) {
  await requireManager("/admin/programmes")
  const programmeId = String(formData.get("programmeId") ?? "")
  const day = String(formData.get("date") ?? "")
  const back = `/admin/programmes/${programmeId}`
  const date = utcDate(day)
  if (!date) failTo(back, "Choose a date.")
  const programme = await prisma.programme.findUnique({
    where: { id: programmeId },
    include: { mealPeriods: true },
  })
  if (!programme) failTo("/admin/programmes", "That programme was not found.")
  if (programme.mealPeriods.length === 0) failTo(back, "Add a meal time first.")
  const start = date < programme.startDate ? date : programme.startDate
  const end = date > programme.endDate ? date : programme.endDate
  if (eachDay(isoDate(start), isoDate(end)).length === 0) failTo(back, "Keep a programme within 31 days.")
  await prisma.programme.update({ where: { id: programmeId }, data: { startDate: start, endDate: end } })
  for (const period of programme.mealPeriods) {
    const cutoffAt = cutoffInstant(deliveryStartFromKey(day, period.deliveryWindowStart), programme.orderCutoffHours)
    const existing = await prisma.mealSlot.findUnique({
      where: { programmeId_mealPeriodId_date: { programmeId, mealPeriodId: period.id, date } },
    })
    if (existing) {
      await prisma.mealSlot.update({ where: { id: existing.id }, data: { isOpen: true, cutoffAt } })
      continue
    }
    await prisma.mealSlot.create({
      data: {
        programmeId,
        mealPeriodId: period.id,
        date,
        capacity: programme.maxOrdersPerSlot ?? DEFAULT_SLOT_CAPACITY,
        isOpen: true,
        cutoffAt,
      },
    })
  }
  touch(programme.id, programme.slug, programme.code)
  noticeTo(back, "Day added.")
}

export async function removeDay(formData: FormData) {
  await requireManager("/admin/programmes")
  const programmeId = String(formData.get("programmeId") ?? "")
  const day = String(formData.get("date") ?? "")
  const back = `/admin/programmes/${programmeId}`
  const programme = await prisma.programme.findUnique({ where: { id: programmeId } })
  if (!programme) failTo("/admin/programmes", "That programme was not found.")
  const slots = await prisma.mealSlot.findMany({
    where: { programmeId },
    include: { _count: { select: { orderSlots: true } } },
  })
  const onDay = slots.filter((slot) => isoDate(slot.date) === day)
  if (onDay.length === 0) failTo(back, "That day is not on this programme.")
  let closed = false
  for (const slot of onDay) {
    if (slot._count.orderSlots > 0) {
      await prisma.mealSlot.update({ where: { id: slot.id }, data: { isOpen: false } })
      closed = true
      continue
    }
    await prisma.mealSlot.delete({ where: { id: slot.id } })
  }
  if (!closed) {
    const remaining = await prisma.mealSlot.findMany({ where: { programmeId }, select: { date: true } })
    if (remaining.length > 0) {
      const keys = remaining.map((slot) => isoDate(slot.date)).sort()
      await prisma.programme.update({
        where: { id: programmeId },
        data: { startDate: utcDate(keys[0]!)!, endDate: utcDate(keys[keys.length - 1]!)! },
      })
    }
  }
  touch(programme.id, programme.slug, programme.code)
  noticeTo(back, closed ? "That day has orders, so its slots were closed instead of removed." : "Day removed.")
}

export async function addPeriod(formData: FormData) {
  await requireManager("/admin/programmes")
  const programmeId = String(formData.get("programmeId") ?? "")
  const name = String(formData.get("name") ?? "")
  const back = `/admin/programmes/${programmeId}`
  const window = SERVICE_WINDOWS.find((item) => item.name === name)
  if (!window) failTo(back, "Choose morning, afternoon or evening.")
  const programme = await prisma.programme.findUnique({
    where: { id: programmeId },
    include: { mealPeriods: true, slots: { select: { date: true } } },
  })
  if (!programme) failTo("/admin/programmes", "That programme was not found.")
  if (programme.mealPeriods.some((period) => period.name === window.name)) failTo(back, `${window.name} is already on this programme.`)
  const period = await prisma.mealPeriod.create({
    data: {
      programmeId,
      name: window.name,
      deliveryWindowStart: window.start,
      deliveryWindowEnd: window.end,
      position: window.position,
    },
  })
  const days = programme.slots.length
    ? [...new Set(programme.slots.map((slot) => isoDate(slot.date)))]
    : eachDay(isoDate(programme.startDate), isoDate(programme.endDate))
  for (const day of days) {
    await prisma.mealSlot.create({
      data: {
        programmeId,
        mealPeriodId: period.id,
        date: utcDate(day)!,
        capacity: programme.maxOrdersPerSlot ?? DEFAULT_SLOT_CAPACITY,
        isOpen: true,
        cutoffAt: cutoffInstant(deliveryStartFromKey(day, window.start), programme.orderCutoffHours),
      },
    })
  }
  touch(programme.id, programme.slug, programme.code)
  noticeTo(back, `${window.name} added.`)
}

export async function removePeriod(formData: FormData) {
  await requireManager("/admin/programmes")
  const id = String(formData.get("id") ?? "")
  const period = await prisma.mealPeriod.findUnique({ where: { id }, include: { programme: true } })
  if (!period) failTo("/admin/programmes", "That meal time was not found.")
  const back = `/admin/programmes/${period.programmeId}`
  const orders = await prisma.orderSlot.count({ where: { mealSlot: { mealPeriodId: id } } })
  if (orders > 0) failTo(back, "That meal time already has orders, so it stays. Close the slots instead.")
  await prisma.programmeMenuItemPeriod.deleteMany({ where: { mealPeriodId: id } })
  await prisma.mealPlanPeriod.deleteMany({ where: { mealPeriodId: id } })
  await prisma.mealSlot.deleteMany({ where: { mealPeriodId: id } })
  await prisma.mealPeriod.delete({ where: { id } })
  touch(period.programme.id, period.programme.slug, period.programme.code)
  noticeTo(back, `${period.name} removed.`)
}

export async function savePeriod(formData: FormData) {
  await requireManager("/admin/programmes")
  const id = String(formData.get("id") ?? "")
  const start = parseClock(String(formData.get("start") ?? ""))
  const end = parseClock(String(formData.get("end") ?? ""))
  const period = await prisma.mealPeriod.findUnique({ where: { id }, include: { programme: true } })
  if (!period) failTo("/admin/programmes", "That meal time was not found.")
  const back = `/admin/programmes/${period.programmeId}`
  if (!start || !end || start >= end) {
    failTo(back, "The delivery window needs a start and a later end, such as 07:00 to 10:00.")
  }
  await prisma.mealPeriod.update({
    where: { id },
    data: { deliveryWindowStart: start, deliveryWindowEnd: end },
  })
  await refreshCutoffs(period.programmeId, period.programme.orderCutoffHours)
  touch(period.programme.id, period.programme.slug, period.programme.code)
  noticeTo(back, `${period.name} times saved.`)
}

export async function saveOfferings(formData: FormData) {
  await requireManager("/admin/programmes")
  const programmeId = String(formData.get("programmeId") ?? "")
  const back = `/admin/programmes/${programmeId}`
  const programme = await prisma.programme.findUnique({ where: { id: programmeId } })
  if (!programme) failTo("/admin/programmes", "That programme was not found.")
  const allowedPeriods = new Set(
    (await prisma.mealPeriod.findMany({ where: { programmeId }, select: { id: true } })).map((period) => period.id),
  )
  const variantIds = formData.getAll("variantId").map((value) => String(value))
  for (const variantId of variantIds) {
    const priceRaw = String(formData.get(`price-${variantId}`) ?? "").trim()
    if (priceRaw && parseNairaToKobo(priceRaw) === null) failTo(back, PRICE_ERROR)
  }
  for (const variantId of variantIds) {
    const variant = await prisma.menuItemVariant.findUnique({ where: { id: variantId } })
    if (!variant) continue
    const periodIds = formData
      .getAll(`period-${variantId}`)
      .map((value) => String(value))
      .filter((periodId) => allowedPeriods.has(periodId))
    const offered = formData.get(`offered-${variantId}`) === "on" && periodIds.length > 0
    const priceRaw = String(formData.get(`price-${variantId}`) ?? "").trim()
    const priceKoboOverride = priceRaw === "" ? null : parseNairaToKobo(priceRaw)
    const existing = await prisma.programmeMenuItem.findUnique({
      where: { programmeId_variantId: { programmeId, variantId } },
    })
    if (!offered) {
      if (!existing) continue
      await prisma.programmeMenuItemPeriod.deleteMany({ where: { programmeMenuItemId: existing.id } })
      await prisma.programmeMenuItem.update({
        where: { id: existing.id },
        data: { isActive: false, priceKoboOverride },
      })
      continue
    }
    const saved = existing
      ? await prisma.programmeMenuItem.update({
          where: { id: existing.id },
          data: { isActive: true, priceKoboOverride },
        })
      : await prisma.programmeMenuItem.create({
          data: { programmeId, variantId, isActive: true, priceKoboOverride },
        })
    const links = await prisma.programmeMenuItemPeriod.findMany({ where: { programmeMenuItemId: saved.id } })
    for (const link of links) {
      if (!periodIds.includes(link.mealPeriodId)) {
        await prisma.programmeMenuItemPeriod.delete({ where: { id: link.id } })
      }
    }
    for (const mealPeriodId of periodIds) {
      await prisma.programmeMenuItemPeriod.upsert({
        where: { programmeMenuItemId_mealPeriodId: { programmeMenuItemId: saved.id, mealPeriodId } },
        create: { programmeMenuItemId: saved.id, mealPeriodId },
        update: {},
      })
    }
  }
  touch(programme.id, programme.slug, programme.code)
  noticeTo(back, "Dishes updated.")
}
