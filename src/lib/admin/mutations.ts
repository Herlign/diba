"use server"

import { Prisma } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { can } from "@/lib/auth/access"
import { getStaff } from "@/lib/auth/session"
import { failTo, noticeTo } from "@/lib/admin/guard"
import { revalidatePublic } from "@/lib/admin/revalidate"
import { formatNaira, parseNairaToKobo } from "@/lib/money"
import { rateLimit } from "@/lib/rate-limit"
import { assessRedemption } from "@/lib/passes/redeem"
import { lagosDateKey } from "@/lib/ordering/rules"
import { formatOrderLine } from "@/lib/ordering/line-label"
import { verifyPassToken } from "@/lib/passes/token"

const PRICE_ERROR = "Enter a price in naira, such as 1500 or 1,500."

function isUnique(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
}

async function allow(section: "catalogue" | "orders" | "dispatch") {
  const staff = await getStaff()
  if (!staff) {
    if (section === "catalogue") failTo("/admin/login", "Sign in as the manager to save changes.")
    return null
  }
  if (section === "catalogue") {
    if (staff.role !== "SUPER_ADMIN") failTo("/admin", "Only the manager can save changes.")
    return staff
  }
  if (!can(staff.role, section)) return null
  return staff
}

export async function updateProgramme(formData: FormData) {
  if (!(await allow("catalogue"))) return
  const id = String(formData.get("id") ?? "")
  const status = String(formData.get("status") ?? "")
  const programme = await prisma.programme.findUnique({ where: { id } })
  const back = programme ? `/admin/programmes/${id}` : "/admin/programmes"
  if (!programme) failTo("/admin/programmes", "That programme was not found.")
  if (!["DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"].includes(status)) failTo(back, "Choose a status.")
  const cutoff = Number(formData.get("cutoff") ?? 24)
  await prisma.programme.update({
    where: { id },
    data: {
      status: status as "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED",
      orderCutoffHours: Number.isFinite(cutoff) ? Math.min(168, Math.max(1, Math.round(cutoff))) : programme.orderCutoffHours,
    },
  })
  revalidatePublic(["/admin/programmes", back])
  noticeTo(back, "Programme saved.")
}

export async function updateSlot(formData: FormData) {
  if (!(await allow("catalogue"))) return
  const id = String(formData.get("id") ?? "")
  const slot = await prisma.mealSlot.findUnique({ where: { id }, select: { programmeId: true } })
  if (!slot) failTo("/admin/programmes", "That slot was not found.")
  const back = `/admin/programmes/${slot.programmeId}`
  const raw = String(formData.get("capacity") ?? "").trim()
  if (!/^\d+$/.test(raw)) failTo(back, "Enter how many meals this slot can take.")
  const isOpen = formData.get("isOpen") === "on"
  await prisma.mealSlot.update({
    where: { id },
    data: { capacity: Number(raw), isOpen },
  })
  revalidatePublic(["/admin/programmes", back])
  noticeTo(back, isOpen ? `Slot saved. It can take ${raw} meals.` : "Slot saved and closed.")
}

export async function updateVariant(formData: FormData) {
  if (!(await allow("catalogue"))) return
  const id = String(formData.get("id") ?? "")
  const name = String(formData.get("name") ?? "").trim()
  const priceKobo = parseNairaToKobo(String(formData.get("naira") ?? ""))
  const position = Number(formData.get("position") ?? 0)
  if (name.length < 1 || name.length > 40) failTo("/admin/menu", "Enter a size name, up to 40 characters.")
  if (priceKobo === null) failTo("/admin/menu", PRICE_ERROR)
  const current = await prisma.menuItemVariant.findUnique({ where: { id } })
  if (!current) failTo("/admin/menu", "That size was not found.")
  const dish = `/admin/menu#dish-${current.menuItemId}`
  const clash = await prisma.menuItemVariant.findFirst({
    where: { menuItemId: current.menuItemId, name, NOT: { id } },
  })
  if (clash) failTo(dish, "That size name is already used on this dish.")
  const isAvailable = formData.get("isAvailable") === "on"
  await prisma.menuItemVariant.update({
    where: { id },
    data: {
      name,
      position: Number.isFinite(position) ? Math.max(0, Math.round(position)) : current.position,
      priceKobo,
      isAvailable,
    },
  })
  await prisma.programmeMenuItem.updateMany({
    where: { variantId: id },
    data: { isActive: isAvailable },
  })
  revalidatePublic(["/admin/menu"])
  const hidden = isAvailable ? "" : " It is hidden from ordering."
  noticeTo(dish, `Saved ${name} at ${formatNaira(priceKobo)}.${hidden}`)
}

export async function createVariant(formData: FormData) {
  if (!(await allow("catalogue"))) return
  const menuItemId = String(formData.get("menuItemId") ?? "")
  const name = String(formData.get("name") ?? "").trim()
  const priceKobo = parseNairaToKobo(String(formData.get("naira") ?? ""))
  if (!menuItemId) failTo("/admin/menu", "Choose a dish first.")
  if (name.length < 1 || name.length > 40) failTo("/admin/menu", "Enter a size name, up to 40 characters.")
  if (priceKobo === null) failTo("/admin/menu", PRICE_ERROR)
  const item = await prisma.menuItem.findUnique({
    where: { id: menuItemId },
    include: {
      variants: {
        orderBy: { position: "asc" },
        include: { offerings: { include: { periods: true } } },
      },
    },
  })
  if (!item) failTo("/admin/menu", "That dish was not found.")
  const variant = await prisma.menuItemVariant.upsert({
    where: { menuItemId_name: { menuItemId, name } },
    create: {
      menuItemId,
      name,
      priceKobo,
      position: item.variants.length,
      isAvailable: true,
    },
    update: {
      priceKobo,
      isAvailable: true,
    },
  })
  const sibling = item.variants.find((entry) => entry.id !== variant.id) ?? item.variants[0]
  if (sibling) {
    for (const offering of sibling.offerings) {
      const saved = await prisma.programmeMenuItem.upsert({
        where: { programmeId_variantId: { programmeId: offering.programmeId, variantId: variant.id } },
        create: { programmeId: offering.programmeId, variantId: variant.id, isActive: true },
        update: { isActive: true },
      })
      for (const period of offering.periods) {
        await prisma.programmeMenuItemPeriod.upsert({
          where: {
            programmeMenuItemId_mealPeriodId: {
              programmeMenuItemId: saved.id,
              mealPeriodId: period.mealPeriodId,
            },
          },
          create: { programmeMenuItemId: saved.id, mealPeriodId: period.mealPeriodId },
          update: {},
        })
      }
    }
  }
  revalidatePublic(["/admin/menu"])
  noticeTo(`/admin/menu#dish-${menuItemId}`, `Saved the ${name} size at ${formatNaira(priceKobo)}.`)
}

export async function removeVariant(formData: FormData) {
  if (!(await allow("catalogue"))) return
  const id = String(formData.get("id") ?? "")
  const variant = await prisma.menuItemVariant.findUnique({
    where: { id },
    include: { _count: { select: { orderItems: true } } },
  })
  if (!variant) failTo("/admin/menu", "That size was not found.")
  const dish = `/admin/menu#dish-${variant.menuItemId}`
  const siblings = await prisma.menuItemVariant.count({ where: { menuItemId: variant.menuItemId } })
  if (siblings <= 1) failTo(dish, "Keep at least one size on this dish.")
  if (variant._count.orderItems > 0) {
    await prisma.menuItemVariant.update({ where: { id }, data: { isAvailable: false } })
    await prisma.programmeMenuItem.updateMany({ where: { variantId: id }, data: { isActive: false } })
  } else {
    await prisma.programmeMenuItemPeriod.deleteMany({ where: { programmeMenuItem: { variantId: id } } })
    await prisma.programmeMenuItem.deleteMany({ where: { variantId: id } })
    await prisma.mealPlan.updateMany({ where: { defaultVariantId: id }, data: { defaultVariantId: null } })
    await prisma.menuItemVariant.delete({ where: { id } })
  }
  revalidatePublic(["/admin/menu"])
  noticeTo(
    dish,
    variant._count.orderItems > 0 ? `${variant.name} is hidden because it is on an order.` : `Removed ${variant.name}.`,
  )
}

export async function archiveItem(formData: FormData) {
  if (!(await allow("catalogue"))) return
  const id = String(formData.get("id") ?? "")
  const item = await prisma.menuItem.findUnique({ where: { id } })
  if (!item) failTo("/admin/menu", "That dish was not found.")
  await prisma.menuItem.update({
    where: { id },
    data: { isActive: false, archivedAt: new Date() },
  })
  revalidatePublic(["/admin/menu"])
  noticeTo("/admin/menu", `${item.name} is archived. Restore it from the bottom of this page.`)
}

export async function updatePlan(formData: FormData) {
  if (!(await allow("catalogue"))) return
  const id = String(formData.get("id") ?? "")
  const plan = await prisma.mealPlan.findUnique({ where: { id } })
  if (!plan) failTo("/admin/plans", "That plan was not found.")
  const percentText = String(formData.get("discountPercent") ?? "").trim()
  const fixedText = String(formData.get("fixedNaira") ?? "").trim()
  let discountPercent: number | null = null
  if (percentText) {
    const percent = Number(percentText.replace(/,/g, ""))
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) failTo("/admin/plans", "Enter a discount from 0 to 100.")
    discountPercent = Math.round(percent)
  }
  let fixedPricePerSlotKobo: number | null = null
  if (fixedText) {
    const kobo = parseNairaToKobo(fixedText)
    if (kobo === null) failTo("/admin/plans", PRICE_ERROR)
    fixedPricePerSlotKobo = kobo
  }
  await prisma.mealPlan.update({
    where: { id },
    data: {
      isActive: formData.get("isActive") === "on",
      discountPercent,
      fixedPricePerSlotKobo,
    },
  })
  revalidatePublic(["/admin/plans"])
  noticeTo("/admin/plans", `${plan.name} saved.`)
}

export async function createPromo(formData: FormData) {
  if (!(await allow("catalogue"))) return
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
  const percent = Number(String(formData.get("percent") ?? "").trim())
  if (!/^[A-Z0-9]{3,20}$/.test(code)) failTo("/admin/promos", "Use 3 to 20 letters or numbers for the code.")
  if (!Number.isInteger(percent) || percent < 1 || percent > 100) failTo("/admin/promos", "Enter a percent from 1 to 100.")
  const usageRaw = String(formData.get("usageLimit") ?? "").trim()
  let usageLimit: number | null = null
  if (usageRaw) {
    const usage = Number(usageRaw)
    if (!Number.isInteger(usage) || usage < 1) failTo("/admin/promos", "Enter a usage limit of at least 1, or leave it blank.")
    usageLimit = usage
  }
  const programmeId = String(formData.get("programmeId") ?? "") || null
  try {
    await prisma.promoCode.create({
      data: {
        code,
        discountType: "PERCENT",
        percentOff: percent,
        programmeId,
        usageLimit,
        isActive: true,
      },
    })
  } catch (error) {
    if (isUnique(error)) failTo("/admin/promos", "That code is already used.")
    throw error
  }
  revalidatePublic(["/admin/promos"])
  noticeTo("/admin/promos", `${code} added. It takes ${percent}% off.`)
}

export async function togglePromo(formData: FormData) {
  if (!(await allow("catalogue"))) return
  const id = String(formData.get("id") ?? "")
  const promo = await prisma.promoCode.findUnique({ where: { id } })
  if (!promo) failTo("/admin/promos", "That code was not found.")
  const active = !promo.isActive
  await prisma.promoCode.update({ where: { id }, data: { isActive: active } })
  revalidatePublic(["/admin/promos"])
  noticeTo("/admin/promos", active ? `${promo.code} is active.` : `${promo.code} is paused.`)
}

export async function setOrderStatus(formData: FormData) {
  if (!(await allow("orders"))) return
  const id = String(formData.get("id") ?? "")
  const status = String(formData.get("status") ?? "")
  const note = String(formData.get("note") ?? "").trim()
  if (!["PAID", "PARTIALLY_FULFILLED", "FULFILLED", "CANCELLED", "REFUNDED"].includes(status)) return
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id },
      data: { status: status as "PAID" | "PARTIALLY_FULFILLED" | "FULFILLED" | "CANCELLED" | "REFUNDED" },
    })
    if (status === "REFUNDED") {
      await tx.payment.updateMany({ where: { orderId: id }, data: { status: "REFUNDED" } })
      const slot = await tx.orderSlot.findFirst({ where: { orderId: id } })
      if (slot) {
        await tx.refundRequest.create({
          data: { orderId: id, orderSlotId: slot.id, status: "APPROVED", note: note || "Marked refunded by staff." },
        })
      }
    }
  })
  revalidatePath("/admin/orders")
}

export async function clearReview(formData: FormData) {
  if (!(await allow("orders"))) return
  const id = String(formData.get("id") ?? "")
  await prisma.order.update({ where: { id }, data: { needsReview: false } })
  revalidatePath("/admin/review")
}

export async function decideRefund(formData: FormData) {
  if (!(await allow("orders"))) return
  const id = String(formData.get("id") ?? "")
  const status = String(formData.get("status") ?? "")
  const note = String(formData.get("note") ?? "").trim()
  if (status !== "APPROVED" && status !== "REJECTED") return
  await prisma.refundRequest.update({
    where: { id },
    data: { status, note: note || undefined },
  })
  revalidatePath("/admin/refunds")
}

async function deliver(orderSlotId: string, staffId: string) {
  return prisma.$transaction(async (tx) => {
    const slot = await tx.orderSlot.findUnique({
      where: { id: orderSlotId },
      include: { items: true, order: { include: { attendee: true } } },
    })
    if (!slot) return null
    if (!["PAID", "PARTIALLY_FULFILLED", "FULFILLED"].includes(slot.order.status)) return null
    const updated = await tx.orderSlot.updateMany({
      where: { id: slot.id, status: { notIn: ["DELIVERED", "CANCELLED"] } },
      data: { status: "DELIVERED", deliveredAt: new Date(), deliveredById: staffId },
    })
    if (updated.count === 0) return null
    const open = await tx.orderSlot.count({
      where: { orderId: slot.orderId, status: { notIn: ["DELIVERED", "CANCELLED"] } },
    })
    await tx.order.update({
      where: { id: slot.orderId },
      data: { status: open === 0 ? "FULFILLED" : "PARTIALLY_FULFILLED" },
    })
    return slot
  })
}

export async function markSlotDelivered(formData: FormData) {
  const staff = await allow("dispatch")
  if (!staff) return
  await deliver(String(formData.get("orderSlotId") ?? ""), staff.id)
  revalidatePath("/admin/dispatch")
}

export async function redeemPass(token: string) {
  const staff = await allow("dispatch")
  if (!staff) return { ok: false as const, reason: "Dispatch or an admin has to scan this." }
  if (!rateLimit(`redeem:${staff.id}`, 40, 10 * 60 * 1000)) {
    return { ok: false as const, reason: "Too many scans. Wait a minute and try again." }
  }
  const secret = process.env.PASS_TOKEN_SECRET || ""
  const verified = secret ? verifyPassToken(token.trim(), secret) : null
  const row = verified
    ? await prisma.orderSlot.findUnique({
        where: { id: verified.orderSlotId },
        include: {
          items: true,
          order: { include: { attendee: true } },
          mealSlot: { include: { mealPeriod: true } },
        },
      })
    : null
  const decision = assessRedemption({
    now: new Date(),
    secret,
    token: token.trim(),
    orderSlot: row
      ? {
          id: row.id,
          mealSlotId: row.mealSlotId,
          status: row.status,
          orderStatus: row.order.status,
          dateKey: lagosDateKey(row.mealSlot.date),
          windowStart: row.mealSlot.mealPeriod.deliveryWindowStart,
          windowEnd: row.mealSlot.mealPeriod.deliveryWindowEnd,
        }
      : null,
  })
  if (!decision.ok) return decision
  const delivered = await deliver(row!.id, staff.id)
  if (!delivered) return { ok: false as const, reason: "This pass was already used." }
  const detail = delivered.items.map((item) => formatOrderLine(item)).join(", ")
  return {
    ok: true as const,
    headline: `Deliver: ${detail}`,
    detail: `${delivered.order.attendee.fullName} · ${delivered.order.reference}`,
  }
}
