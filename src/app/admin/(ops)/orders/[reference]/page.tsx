import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { formatNaira } from "@/lib/money"
import { formatOrderLine } from "@/lib/ordering/line-label"
import { formatDayLabel, formatWindow } from "@/lib/dates"
import { requireSection } from "@/lib/admin/require"
import { setOrderStatus } from "@/lib/admin/mutations"

export const instant = false

export const metadata = { title: "Order" }

export default async function OrderAdminPage({ params }: { params: Promise<{ reference: string }> }) {
  await requireSection("orders")
  const { reference } = await params
  const order = await prisma.order.findUnique({
    where: { reference },
    include: {
      attendee: true,
      programme: true,
      deliveryPoint: true,
      payment: true,
      slots: { include: { mealSlot: { include: { mealPeriod: true } }, items: true }, orderBy: { mealSlot: { date: "asc" } } },
    },
  })
  if (!order) notFound()
  return (
    <div>
      <p className="text-sm font-semibold tracking-wide text-palm uppercase">{order.status.toLowerCase().replaceAll("_", " ")}</p>
      <h1 className="font-heading text-4xl">{order.reference}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {order.attendee.fullName} · {order.attendee.phone} · {order.attendee.email}
      </p>
      <p className="text-sm">
        {order.programme.title} · {order.deliveryPoint.name} · {order.numberOfPeople} people · {formatNaira(order.totalKobo)}
      </p>
      {order.dietaryNotes ? <p className="mt-2 text-sm">Notes: {order.dietaryNotes}</p> : null}
      {order.needsReview ? <p className="mt-2 text-sm text-tomato">This payment needs a review.</p> : null}
      <ol className="mt-4 space-y-2">
        {order.slots.map((slot) => (
          <li key={slot.id} className="rounded-2xl bg-white p-4 text-sm ring-1 ring-foreground/10">
            <p className="font-semibold">
              {formatDayLabel(slot.mealSlot.date)} · {slot.mealSlot.mealPeriod.name} · {slot.status.toLowerCase().replaceAll("_", " ")}
            </p>
            <p className="text-muted-foreground">
              {formatWindow(slot.mealSlot.mealPeriod.deliveryWindowStart, slot.mealSlot.mealPeriod.deliveryWindowEnd)}
            </p>
            <ul>
              {slot.items.map((item) => (
                <li key={item.id}>
                  {formatOrderLine(item)}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      <form action={setOrderStatus} className="mt-4 flex flex-wrap items-end gap-2 rounded-2xl bg-white p-4 ring-1 ring-foreground/10">
        <input type="hidden" name="id" value={order.id} />
        <label className="text-sm">
          Status
          <select name="status" defaultValue={order.status} className="mt-1 block h-11 rounded-lg border border-border px-3">
            {["PAID", "PARTIALLY_FULFILLED", "FULFILLED", "CANCELLED", "REFUNDED"].map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Note if refunded
          <input name="note" className="mt-1 block h-11 rounded-lg border border-border px-3" />
        </label>
        <button type="submit" className="h-11 rounded-lg bg-palm px-4 text-sm font-semibold text-cream">
          Update order
        </button>
      </form>
    </div>
  )
}
