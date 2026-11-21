import { prisma } from "@/lib/prisma"
import { applyChargeSuccess } from "@/lib/payments/apply"
import { verifyPaystackSignature } from "@/lib/payments/signature"
import { sendOrderConfirmation } from "@/lib/email/order-confirmation"

export async function POST(request: Request) {
  const raw = await request.text()
  const secret = process.env.PAYSTACK_SECRET_KEY ?? ""
  if (!verifyPaystackSignature(raw, request.headers.get("x-paystack-signature"), secret)) {
    return new Response("Invalid signature", { status: 401 })
  }
  let body: { event?: string; data?: { reference?: string; amount?: number; currency?: string } }
  try {
    body = JSON.parse(raw) as typeof body
  } catch {
    return Response.json({ ok: true, ignored: true })
  }
  const reference = body.data?.reference
  if (!reference) return Response.json({ ok: true, ignored: true })
  const result = await applyChargeSuccess(reference, {
    event: body.event ?? "",
    reference,
    amountKobo: body.data?.amount ?? 0,
    currency: body.data?.currency ?? "",
  })
  if (result.decision.type === "mark_paid" && result.orderId) {
    const order = await prisma.order.findUnique({ where: { id: result.orderId }, select: { id: true, status: true } })
    if (order?.status === "PAID") await sendOrderConfirmation(order.id)
  }
  return Response.json({ ok: true, result: result.decision.type })
}
