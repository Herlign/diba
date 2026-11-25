"use server"

import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { can } from "@/lib/auth/access"
import { getStaff } from "@/lib/auth/session"
import { rateLimit } from "@/lib/rate-limit"
import { assessRedemption } from "@/lib/passes/redeem"
import { lagosDateKey } from "@/lib/ordering/rules"
import { formatOrderLine } from "@/lib/ordering/line-label"
import { verifyPassToken } from "@/lib/passes/token"

async function allow(section: "catalogue" | "orders" | "dispatch") {
  const staff = await getStaff()
  if (!staff || !can(staff.role, section)) return null
  return staff
}

export async function updateProgramme(formData: FormData) {
  if (!(await allow("catalogue"))) return
  const id = String(formData.get("id") ?? "")
  const status = String(formData.get("status") ?? "")
  const cutoff = Number(formData.get("cutoff") ?? 24)
  if (!["DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"].includes(status)) return
  await prisma.programme.update({
    where: { id },
    data: { status: status as "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED", orderCutoffHours: Math.min(168, Math.max(1, cutoff)) },
  })
  revalidatePath("/admin/programmes")
}

export async function updateSlot(formData: FormData) {
  if (!(await allow("catalogue"))) return
  const id = String(formData.get("id") ?? "")
  const capacity = Number(formData.get("capacity") ?? 0)
  const isOpen = formData.get("isOpen") === "on"
  await prisma.mealSlot.update({
    where: { id },
    data: { capacity: Number.isFinite(capacity) && capacity >= 0 ? capacity : null, isOpen },
  })
  revalidatePath("/admin/programmes")
}

export async function updateVariant(formData: FormData) {
  if (!(await allow("catalogue"))) return
  const id = String(formData.get("id") ?? "")
  const name = String(formData.get("name") ?? "").trim()
  const naira = Number(formData.get("naira") ?? 0)
  const position = Number(formData.get("position") ?? 0)
  if (name.length < 1 || name.length > 40 || !Number.isFinite(naira)) return
  const current = await prisma.menuItemVariant.findUnique({ where: { id } })
  if (!current) return
  const clash = await prisma.menuItemVariant.findFirst({
    where: { menuItemId: current.menuItemId, name, NOT: { id } },
  })
  if (clash) return
  const isAvailable = formData.get("isAvailable") === "on"
  await prisma.menuItemVariant.update({
    where: { id },
    data: {
      name,
      position: Number.isFinite(position) ? Math.max(0, Math.round(position)) : current.position,
      priceKobo: Math.max(0, Math.round(naira * 100)),
      isAvailable,
    },
  })
  await prisma.programmeMenuItem.updateMany({
    where: { variantId: id },
    data: { isActive: isAvailable },
  })
  revalidatePath("/admin/menu")
}

export async function createVariant(formData: FormData) {
  if (!(await allow("catalogue"))) return
  const menuItemId = String(formData.get("menuItemId") ?? "")
  const name = String(formData.get("name") ?? "").trim()
  const naira = Number(formData.get("naira") ?? 0)
  if (!menuItemId || name.length < 1 || name.length > 40 || !Number.isFinite(naira)) return
  const item = await prisma.menuItem.findUnique({
    where: { id: menuItemId },
    include: {
      variants: {
        orderBy: { position: "asc" },
        include: { offerings: { include: { periods: true } } },
      },
    },
  })
  if (!item) return
  const variant = await prisma.menuItemVariant.upsert({
    where: { menuItemId_name: { menuItemId, name } },
    create: {
      menuItemId,
      name,
      priceKobo: Math.max(0, Math.round(naira * 100)),
      position: item.variants.length,
      isAvailable: true,
    },
    update: {
      priceKobo: Math.max(0, Math.round(naira * 100)),
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
  revalidatePath("/admin/menu")
}

export async function removeVariant(formData: FormData) {
  if (!(await allow("catalogue"))) return
  const id = String(formData.get("id") ?? "")
  const variant = await prisma.menuItemVariant.findUnique({
    where: { id },
    include: { _count: { select: { orderItems: true } } },
  })
  if (!variant) return
  const siblings = await prisma.menuItemVariant.count({ where: { menuItemId: variant.menuItemId } })
  if (siblings <= 1) return
  if (variant._count.orderItems > 0) {
    await prisma.menuItemVariant.update({ where: { id }, data: { isAvailable: false } })
    await prisma.programmeMenuItem.updateMany({ where: { variantId: id }, data: { isActive: false } })
  } else {
    await prisma.programmeMenuItemPeriod.deleteMany({ where: { programmeMenuItem: { variantId: id } } })
    await prisma.programmeMenuItem.deleteMany({ where: { variantId: id } })
    await prisma.mealPlan.updateMany({ where: { defaultVariantId: id }, data: { defaultVariantId: null } })
    await prisma.menuItemVariant.delete({ where: { id } })
  }
  revalidatePath("/admin/menu")
}

export async function archiveItem(formData: FormData) {
  if (!(await allow("catalogue"))) return
  const id = String(formData.get("id") ?? "")
  await prisma.menuItem.update({
    where: { id },
    data: { isActive: false, archivedAt: new Date() },
  })
  revalidatePath("/admin/menu")
}

export async function updatePlan(formData: FormData) {
  if (!(await allow("catalogue"))) return
  const id = String(formData.get("id") ?? "")
  const percent = formData.get("discountPercent")
  const fixed = formData.get("fixedNaira")
  await prisma.mealPlan.update({
    where: { id },
    data: {
      isActive: formData.get("isActive") === "on",
      discountPercent: percent ? Math.min(100, Math.max(0, Number(percent))) : null,
      fixedPricePerSlotKobo: fixed ? Math.max(0, Math.round(Number(fixed) * 100)) : null,
    },
  })
  revalidatePath("/admin/plans")
}

export async function createPromo(formData: FormData) {
  if (!(await allow("catalogue"))) return
  const code = String(formData.get("code") ?? "").trim().toUpperCase()
  const percent = Number(formData.get("percent") ?? 0)
  if (code.length < 3 || percent < 1) return
  const programmeId = String(formData.get("programmeId") ?? "") || null
  await prisma.promoCode.create({
    data: {
      code,
      discountType: "PERCENT",
      percentOff: Math.min(100, percent),
      programmeId,
      usageLimit: Number(formData.get("usageLimit") ?? 0) || null,
      isActive: true,
    },
  })
  revalidatePath("/admin/promos")
}

export async function togglePromo(formData: FormData) {
  if (!(await allow("catalogue"))) return
  const id = String(formData.get("id") ?? "")
  const promo = await prisma.promoCode.findUnique({ where: { id } })
  if (!promo) return
  await prisma.promoCode.update({ where: { id }, data: { isActive: !promo.isActive } })
  revalidatePath("/admin/promos")
}

export async function createPoint(formData: FormData) {
  if (!(await allow("catalogue"))) return
  const venueId = String(formData.get("venueId") ?? "")
  const name = String(formData.get("name") ?? "").trim()
  if (!venueId || name.length < 2) return
  await prisma.deliveryPoint.create({
    data: {
      venueId,
      name,
      description: String(formData.get("description") ?? "").trim(),
    },
  })
  revalidatePath("/admin/points")
}

export async function togglePoint(formData: FormData) {
  if (!(await allow("catalogue"))) return
  const id = String(formData.get("id") ?? "")
  const point = await prisma.deliveryPoint.findUnique({ where: { id } })
  if (!point) return
  await prisma.deliveryPoint.update({ where: { id }, data: { isActive: !point.isActive } })
  revalidatePath("/admin/points")
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

export async function inviteStaff(formData: FormData) {
  const staff = await getStaff()
  if (!staff || staff.role !== "SUPER_ADMIN") return
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const name = String(formData.get("name") ?? "").trim()
  const role = String(formData.get("role") ?? "")
  const password = String(formData.get("password") ?? "")
  if (!email.includes("@") || name.length < 2 || password.length < 8) return
  if (!["SUPER_ADMIN", "CHURCH_ADMIN", "KITCHEN", "DISPATCH"].includes(role)) return
  await prisma.staffUser.upsert({
    where: { email },
    create: { email, name, role: role as "SUPER_ADMIN" | "CHURCH_ADMIN" | "KITCHEN" | "DISPATCH", passwordHash: bcrypt.hashSync(password, 10) },
    update: { name, role: role as "SUPER_ADMIN" | "CHURCH_ADMIN" | "KITCHEN" | "DISPATCH", passwordHash: bcrypt.hashSync(password, 10), isActive: true },
  })
  revalidatePath("/admin")
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
