"use server"

import { prisma } from "@/lib/prisma"
import { formatDayLabel, formatLagosMoment } from "@/lib/dates"
import { cutoffInstant, deliveryStartFromKey, lagosDateKey } from "@/lib/ordering/rules"
import { tokensMatch } from "@/lib/secret-match"
import { rateLimit } from "@/lib/rate-limit"
import { signMagicLink, verifyMagicLink } from "@/lib/magic/link"
import { sendEmail } from "@/lib/email/send"
import { siteUrl } from "@/lib/site"

function authSecret() {
  return process.env.AUTH_SECRET || ""
}

export async function requestMagicLink(emailRaw: string) {
  const email = emailRaw.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false as const, error: "Enter the email you used at checkout." }
  }
  if (!rateLimit(`magic:${email}`, 5, 10 * 60 * 1000)) {
    return { ok: false as const, error: "Too many links just now. Wait a few minutes." }
  }
  const count = await prisma.order.count({ where: { attendee: { email: { equals: email, mode: "insensitive" } } } })
  if (count === 0) {
    return { ok: true as const, message: "No orders on that email yet.", previewUrl: null }
  }
  const secret = authSecret()
  if (!secret) return { ok: false as const, error: "Sign-in links are not configured yet." }
  const token = signMagicLink(email, secret)
  const previewUrl = `${siteUrl()}/my-orders?token=${token}`
  await sendEmail({
    to: email,
    subject: "Your Diba Meals orders",
    text: `Open your orders: ${previewUrl}\nThis link works for 2 hours.`,
    html: `<p><a href="${previewUrl}">Open your orders</a></p><p>This link works for 2 hours.</p>`,
  })
  const preview = process.env.RESEND_API_KEY ? null : previewUrl
  return {
    ok: true as const,
    message: preview
      ? "Email isn't connected on this preview, so the link is here as well as in the server log."
      : "Check your inbox for the link. It works for 2 hours.",
    previewUrl: preview,
  }
}

export async function ordersForMagicLink(token: string) {
  const secret = authSecret()
  const verified = secret ? verifyMagicLink(token, secret) : null
  if (!verified) return { ok: false as const, error: "That link has expired. Ask for a new one." }
  const orders = await prisma.order.findMany({
    where: { attendee: { email: { equals: verified.email, mode: "insensitive" } } },
    orderBy: { createdAt: "desc" },
    include: {
      programme: { select: { title: true, slug: true, orderCutoffHours: true } },
      deliveryPoint: { select: { name: true } },
      slots: {
        include: {
          mealSlot: { include: { mealPeriod: true } },
          items: true,
          refundRequests: { select: { id: true, status: true } },
        },
      },
    },
  })
  const now = new Date()
  return {
    ok: true as const,
    email: verified.email,
    orders: orders.map((order) => ({
      reference: order.reference,
      accessToken: order.accessToken,
      status: order.status,
      totalKobo: order.totalKobo,
      needsReview: order.needsReview,
      title: order.programme.title,
      deliveryPoint: order.deliveryPoint.name,
      slots: order.slots
        .map((slot) => {
          const dateKey = lagosDateKey(slot.mealSlot.date)
          const start = deliveryStartFromKey(dateKey, slot.mealSlot.mealPeriod.deliveryWindowStart)
          const cutoff = cutoffInstant(start, order.programme.orderCutoffHours)
          const cancellable =
            (order.status === "PAID" || order.status === "PARTIALLY_FULFILLED") &&
            slot.status === "SCHEDULED" &&
            slot.refundRequests.length === 0 &&
            now < cutoff
          return {
            id: slot.id,
            label: `${formatDayLabel(slot.mealSlot.date)} · ${slot.mealSlot.mealPeriod.name}`,
            status: slot.status,
            refundRequested: slot.refundRequests.length > 0,
            cancellable,
            closedLabel: formatLagosMoment(cutoff),
            items: slot.items.map((item) => `${item.quantity}× ${item.nameSnapshot}`),
          }
        })
        .sort((a, b) => a.label.localeCompare(b.label)),
    })),
  }
}

export async function requestSlotRefund(reference: string, accessToken: string, orderSlotId: string) {
  const order = await prisma.order.findUnique({
    where: { reference },
    include: {
      programme: true,
      slots: { include: { mealSlot: { include: { mealPeriod: true } }, refundRequests: true } },
    },
  })
  if (!order || !tokensMatch(order.accessToken, accessToken)) {
    return { ok: false as const, error: "We couldn't find that order." }
  }
  if (order.status !== "PAID" && order.status !== "PARTIALLY_FULFILLED") {
    return { ok: false as const, error: "Only a paid meal can be cancelled." }
  }
  const slot = order.slots.find((item) => item.id === orderSlotId)
  if (!slot) return { ok: false as const, error: "That meal is not on this order." }
  if (slot.refundRequests.length > 0 || slot.status === "CANCELLED") {
    return { ok: true as const, message: "A refund is already requested for that meal." }
  }
  if (slot.status !== "SCHEDULED") {
    return { ok: false as const, error: "That meal is already with the kitchen." }
  }
  const dateKey = lagosDateKey(slot.mealSlot.date)
  const start = deliveryStartFromKey(dateKey, slot.mealSlot.mealPeriod.deliveryWindowStart)
  const cutoff = cutoffInstant(start, order.programme.orderCutoffHours)
  if (!(new Date() < cutoff)) {
    return { ok: false as const, error: `Ordering for this slot closed on ${formatLagosMoment(cutoff)}.` }
  }
  await prisma.$transaction(async (tx) => {
    await tx.refundRequest.create({
      data: {
        orderId: order.id,
        orderSlotId: slot.id,
        note: "Attendee cancelled before the cutoff. No automatic refund.",
      },
    })
    await tx.orderSlot.update({ where: { id: slot.id }, data: { status: "CANCELLED" } })
    const remaining = await tx.orderSlot.count({
      where: { orderId: order.id, status: { not: "CANCELLED" } },
    })
    if (remaining === 0) {
      await tx.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } })
    }
  })
  return { ok: true as const, message: "Refund requested. The church team reviews it. Nothing is refunded automatically." }
}
