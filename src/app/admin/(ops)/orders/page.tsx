import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { formatNaira } from "@/lib/money"
import { requireSection } from "@/lib/admin/require"

export const instant = false

export const metadata = { title: "Orders" }

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; programme?: string; status?: string; point?: string }>
}) {
  await requireSection("orders")
  const { q, programme, status, point } = await searchParams
  const [programmes, points, orders] = await Promise.all([
    prisma.programme.findMany({ orderBy: { title: "asc" } }),
    prisma.deliveryPoint.findMany({ orderBy: { name: "asc" } }),
    prisma.order.findMany({
      where: {
        programmeId: programme || undefined,
        status: status ? (status as "PAID") : undefined,
        deliveryPointId: point || undefined,
        OR: q
          ? [
              { reference: { contains: q, mode: "insensitive" } },
              { attendee: { fullName: { contains: q, mode: "insensitive" } } },
              { attendee: { phone: { contains: q } } },
              { attendee: { email: { contains: q, mode: "insensitive" } } },
            ]
          : undefined,
      },
      include: { attendee: true, programme: true, deliveryPoint: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ])
  const exportQuery = new URLSearchParams()
  if (q) exportQuery.set("q", q)
  if (programme) exportQuery.set("programme", programme)
  if (status) exportQuery.set("status", status)
  if (point) exportQuery.set("point", point)
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-heading text-4xl">Orders</h1>
        <a href={`/admin/orders/export?${exportQuery.toString()}`} className="inline-flex h-11 items-center rounded-lg bg-gold px-4 text-sm font-semibold text-ink">
          Export CSV
        </a>
      </div>
      <form className="mt-4 grid gap-2 sm:grid-cols-5">
        <input name="q" defaultValue={q} placeholder="Name, phone, reference" className="h-11 rounded-lg border border-border bg-white px-3 sm:col-span-2" />
        <select name="programme" defaultValue={programme ?? ""} className="h-11 rounded-lg border border-border bg-white px-3">
          <option value="">All programmes</option>
          {programmes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={status ?? ""} className="h-11 rounded-lg border border-border bg-white px-3">
          <option value="">Any status</option>
          {["PENDING_PAYMENT", "PAID", "PARTIALLY_FULFILLED", "FULFILLED", "CANCELLED", "REFUNDED"].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select name="point" defaultValue={point ?? ""} className="h-11 rounded-lg border border-border bg-white px-3">
          <option value="">Any drop point</option>
          {points.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <button type="submit" className="h-11 rounded-lg bg-palm px-4 text-sm font-semibold text-cream sm:col-span-5 sm:w-fit">
          Filter
        </button>
      </form>
      <ul className="mt-4 space-y-2">
        {orders.map((order) => (
          <li key={order.id}>
            <Link href={`/admin/orders/${order.reference}`} className="block rounded-2xl bg-white p-4 ring-1 ring-foreground/10">
              <span className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-semibold">{order.reference}</span>
                <span className="font-heading text-xl">{formatNaira(order.totalKobo)}</span>
              </span>
              <span className="mt-1 block text-sm text-muted-foreground">
                {order.attendee.fullName} · {order.programme.title} · {order.deliveryPoint.name} · {order.status.toLowerCase().replaceAll("_", " ")}
                {order.needsReview ? " · needs review" : ""}
              </span>
            </Link>
          </li>
        ))}
        {orders.length === 0 ? <li className="text-sm text-muted-foreground">No orders match.</li> : null}
      </ul>
    </div>
  )
}
