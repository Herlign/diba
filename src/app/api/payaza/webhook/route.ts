import { prisma } from "@/lib/prisma"
import { applyChargeSuccess } from "@/lib/payments/apply"
import { verifyPayazaSignature } from "@/lib/payments/signature"
import { fetchPayazaTransaction, isPayazaPaid, payazaReferenceCandidates } from "@/lib/payments/payaza"
import { sendOrderConfirmation } from "@/lib/email/order-confirmation"

export async function POST(request: Request) {
  const raw = await request.text()
  const secret = process.env.PAYAZA_SECRET_KEY ?? ""
  if (!verifyPayazaSignature(raw, request.headers.get("x-payaza-signature"), secret)) {
    return new Response("Invalid signature", { status: 401 })
  }
  let body: { merchant_reference?: unknown; transaction_reference?: unknown }
  try {
    body = JSON.parse(raw) as typeof body
  } catch {
    return Response.json({ ok: true, ignored: true })
  }
  const candidates = payazaReferenceCandidates(body)
  if (candidates.length === 0) return Response.json({ ok: true, ignored: true })

  let remote = null
  let queried = ""
  try {
    for (const reference of candidates) {
      queried = reference
      remote = await fetchPayazaTransaction(reference)
      if (remote) break
    }
  } catch {
    return new Response("Could not verify the payment", { status: 503 })
  }
  if (!remote) return Response.json({ ok: true, ignored: true })
  const status = remote.status.trim().toLowerCase()
  if (!isPayazaPaid(remote.status)) {
    if (status === "initialized" || status === "pending") {
      return new Response("Payment is not complete yet", { status: 503 })
    }
    return Response.json({ ok: true, ignored: true })
  }

  const reference = remote.merchantReference || queried
  const result = await applyChargeSuccess(reference, {
    event: "charge.success",
    reference,
    amountKobo: remote.amountKobo,
    currency: remote.currency,
  })
  if (result.decision.type === "mark_paid" && result.orderId) {
    const order = await prisma.order.findUnique({ where: { id: result.orderId }, select: { id: true, status: true } })
    if (order?.status === "PAID") await sendOrderConfirmation(order.id)
  }
  return Response.json({ ok: true, result: result.decision.type })
}
