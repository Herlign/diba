import { prisma } from "@/lib/prisma"
import { PENDING_HOLD_MS } from "@/lib/ordering/rules"

async function release(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 })
  }
  const cutoff = new Date(Date.now() - PENDING_HOLD_MS)
  const stale = await prisma.order.findMany({
    where: { status: "PENDING_PAYMENT", createdAt: { lt: cutoff } },
    select: { id: true },
  })
  if (stale.length === 0) return Response.json({ released: 0 })
  const ids = stale.map((order) => order.id)
  await prisma.$transaction([
    prisma.order.updateMany({
      where: { id: { in: ids }, status: "PENDING_PAYMENT" },
      data: { status: "CANCELLED" },
    }),
    prisma.orderSlot.updateMany({
      where: { orderId: { in: ids }, status: "SCHEDULED" },
      data: { status: "CANCELLED" },
    }),
  ])
  return Response.json({ released: ids.length })
}

export async function GET(request: Request) {
  return release(request)
}

export async function POST(request: Request) {
  return release(request)
}
