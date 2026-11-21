import "server-only"
import { prisma } from "@/lib/prisma"
import { decideChargeSuccess, type PaymentEvent } from "@/lib/payments/decide"

export async function applyChargeSuccess(reference: string, event: PaymentEvent) {
  return prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Order"
      WHERE "paystackReference" = ${reference} OR reference = ${reference}
      FOR UPDATE
    `
    const id = locked[0]?.id
    if (!id) return { decision: { type: "ignore" as const }, orderId: null }
    const order = await tx.order.findUnique({ where: { id }, include: { payment: true } })
    if (!order) return { decision: { type: "ignore" as const }, orderId: null }
    const decision = decideChargeSuccess(
      {
        status: order.status,
        totalKobo: order.totalKobo,
        paymentStatus: order.payment?.status ?? null,
        needsReview: order.needsReview,
      },
      event,
    )
    if (decision.type === "mark_paid") {
      await tx.order.update({ where: { id }, data: { status: "PAID", needsReview: false } })
      if (order.payment) {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: {
            status: "SUCCESS",
            paidAt: new Date(),
            amountKobo: event.amountKobo,
            currency: event.currency,
            rawPayload: event,
          },
        })
      }
    } else if (decision.type === "flag_review") {
      await tx.order.update({ where: { id }, data: { needsReview: true } })
      if (order.payment) {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: { rawPayload: { reason: decision.reason, ...event } },
        })
      }
    }
    return { decision, orderId: id }
  })
}
