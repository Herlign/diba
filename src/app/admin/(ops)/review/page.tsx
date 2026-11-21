import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { formatNaira } from "@/lib/money"
import { requireSection } from "@/lib/admin/require"
import { clearReview } from "@/lib/admin/mutations"

export const metadata = { title: "Needs review" }

export default async function ReviewQueuePage() {
  await requireSection("orders")
  const orders = await prisma.order.findMany({
    where: { needsReview: true },
    include: { attendee: true, programme: true, payment: true },
    orderBy: { updatedAt: "desc" },
  })
  return (
    <div>
      <h1 className="font-heading text-4xl">Needs review</h1>
      <p className="mt-2 text-sm text-muted-foreground">Payments whose amount or currency did not match the order.</p>
      <ul className="mt-4 space-y-3">
        {orders.map((order) => (
          <li key={order.id} className="rounded-2xl bg-white p-4 ring-1 ring-foreground/10">
            <Link href={`/admin/orders/${order.reference}`} className="font-semibold text-palm">
              {order.reference}
            </Link>
            <p className="text-sm">
              {order.attendee.fullName} · {order.programme.title} · order {formatNaira(order.totalKobo)}
              {order.payment ? ` · paid record ${formatNaira(order.payment.amountKobo)} ${order.payment.currency}` : ""}
            </p>
            <form action={clearReview} className="mt-2">
              <input type="hidden" name="id" value={order.id} />
              <button type="submit" className="h-11 text-sm font-semibold text-palm">
                Clear review flag
              </button>
            </form>
          </li>
        ))}
        {orders.length === 0 ? <li className="text-sm text-muted-foreground">Nothing is waiting.</li> : null}
      </ul>
    </div>
  )
}
