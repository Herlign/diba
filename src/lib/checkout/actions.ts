"use server"

import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { rateLimit } from "@/lib/rate-limit"
import { tokensMatch } from "@/lib/secret-match"
import { paymentsMode } from "@/lib/site"
import { createPendingOrder, type PlaceOrderInput } from "@/lib/checkout/create-order"
import { applyChargeSuccess } from "@/lib/payments/apply"
import { payazaCheckoutPhone, splitCustomerName } from "@/lib/payments/customer"
import { isPayazaPaid, loadPayazaTransaction, payazaConnectionMode, payazaPublicKey } from "@/lib/payments/payaza"
import { sendOrderConfirmation } from "@/lib/email/order-confirmation"

async function clientKey() {
  const headerStore = await headers()
  return headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || "local"
}

export async function placeOrder(input: PlaceOrderInput) {
  const phone = input.attendee?.phone ?? "unknown"
  const allowed = rateLimit(`checkout:${await clientKey()}:${phone}`, 8, 10 * 60 * 1000)
  if (!allowed) return { ok: false as const, error: "Too many payment attempts. Wait a few minutes and try again." }
  return createPendingOrder(input)
}

export async function getPaymentSheet(reference: string, accessToken: string) {
  const order = await prisma.order.findUnique({
    where: { reference },
    select: {
      id: true,
      reference: true,
      accessToken: true,
      status: true,
      totalKobo: true,
      needsReview: true,
      attendee: { select: { email: true, fullName: true, phone: true } },
    },
  })
  if (!order || !tokensMatch(order.accessToken, accessToken)) return { ok: false as const, error: "We couldn't find that payment." }
  const name = splitCustomerName(order.attendee.fullName)
  const live = paymentsMode() === "live"
  return {
    ok: true as const,
    mode: paymentsMode(),
    reference: order.reference,
    orderId: order.id,
    status: order.status,
    totalKobo: order.totalKobo,
    email: order.attendee.email,
    firstName: name.firstName,
    lastName: name.lastName,
    phone: payazaCheckoutPhone(order.attendee.phone),
    needsReview: order.needsReview,
    publicKey: live ? payazaPublicKey() : null,
    connectionMode: payazaConnectionMode(),
    href: `/orders/${order.reference}?token=${order.accessToken}`,
  }
}

async function settle(reference: string, accessToken: string, event: { amountKobo: number; currency: string }) {
  const order = await prisma.order.findUnique({ where: { reference } })
  if (!order || !tokensMatch(order.accessToken, accessToken)) {
    return { ok: false as const, error: "We couldn't find that payment." }
  }
  const result = await applyChargeSuccess(order.paystackReference ?? order.reference, {
    event: "charge.success",
    reference: order.reference,
    amountKobo: event.amountKobo,
    currency: event.currency,
  })
  if (result.decision.type === "mark_paid" && result.orderId) await sendOrderConfirmation(result.orderId)
  if (result.decision.type === "flag_review") return { ok: false as const, error: result.decision.reason }
  if (result.decision.type === "ignore") return { ok: false as const, error: "That payment could not be applied." }
  return { ok: true as const, href: `/orders/${order.reference}?token=${order.accessToken}` }
}

export async function confirmMockPayment(reference: string, accessToken: string) {
  if (paymentsMode() !== "mock") return { ok: false as const, error: "Mock payments are turned off." }
  const order = await prisma.order.findUnique({ where: { reference }, select: { totalKobo: true, accessToken: true } })
  if (!order || !tokensMatch(order.accessToken, accessToken)) {
    return { ok: false as const, error: "We couldn't find that payment." }
  }
  return settle(reference, accessToken, { amountKobo: order.totalKobo, currency: "NGN" })
}

export async function verifyPayment(reference: string, accessToken: string) {
  if (paymentsMode() === "mock") return confirmMockPayment(reference, accessToken)
  const order = await prisma.order.findUnique({ where: { reference } })
  if (!order || !tokensMatch(order.accessToken, accessToken)) {
    return { ok: false as const, error: "We couldn't find that payment." }
  }
  try {
    const remote = await loadPayazaTransaction(order.paystackReference ?? order.reference)
    if (!remote || !isPayazaPaid(remote.status)) {
      return { ok: false as const, error: "Payaza has not confirmed this payment yet." }
    }
    return settle(reference, accessToken, { amountKobo: remote.amountKobo, currency: remote.currency })
  } catch {
    return { ok: false as const, error: "We couldn't check that payment. Try again." }
  }
}
