import { prisma } from "@/lib/prisma"
import { formatDayLabel, formatWindow } from "@/lib/dates"
import { requireSection } from "@/lib/admin/require"
import { markSlotDelivered } from "@/lib/admin/mutations"
import { formatOrderLine } from "@/lib/ordering/line-label"
import { PassScanner } from "@/components/admin/scanner"

export const metadata = { title: "Dispatch" }

const PAID = ["PAID", "PARTIALLY_FULFILLED", "FULFILLED"] as const

export default async function DispatchPage({ searchParams }: { searchParams: Promise<{ slot?: string; ref?: string }> }) {
  await requireSection("dispatch")
  const { slot: slotId, ref } = await searchParams
  const slots = await prisma.mealSlot.findMany({
    include: { mealPeriod: true, programme: true },
    orderBy: [{ date: "asc" }, { mealPeriod: { position: "asc" } }],
  })
  const selected = slots.find((slot) => slot.id === slotId) ?? slots[0]
  const manifest = selected
    ? await prisma.orderSlot.findMany({
        where: { mealSlotId: selected.id, order: { status: { in: [...PAID] } }, status: { not: "CANCELLED" } },
        include: { items: true, order: { include: { attendee: true, deliveryPoint: true } } },
        orderBy: { order: { deliveryPoint: { name: "asc" } } },
      })
    : []
  const groups = new Map<string, typeof manifest>()
  for (const row of manifest) {
    const name = row.order.deliveryPoint.name
    groups.set(name, [...(groups.get(name) ?? []), row])
  }
  const lookup = ref
    ? await prisma.order.findFirst({
        where: { reference: { equals: ref.trim(), mode: "insensitive" } },
        include: {
          attendee: true,
          slots: { include: { items: true, mealSlot: { include: { mealPeriod: true } } } },
        },
      })
    : null
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-4xl">Dispatch</h1>
      <PassScanner />
      <form className="flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="order-ref">
          Order reference
        </label>
        <input id="order-ref" name="ref" defaultValue={ref} placeholder="DM-REBOOT26-00001" className="h-12 flex-1 rounded-lg border border-border bg-white px-3" />
        <button type="submit" className="h-12 rounded-lg bg-palm px-4 text-sm font-semibold text-cream">
          Look up reference
        </button>
      </form>
      {ref && !lookup ? <p className="text-sm text-tomato">No order with that reference.</p> : null}
      {lookup ? (
        <section className="rounded-2xl bg-white p-4 ring-1 ring-foreground/10">
          <h2 className="font-heading text-2xl">{lookup.reference}</h2>
          <p className="text-sm text-muted-foreground">
            {lookup.attendee.fullName} · {lookup.attendee.phone} · {lookup.status.toLowerCase().replaceAll("_", " ")}
          </p>
          <ul className="mt-3 space-y-2">
            {lookup.slots.map((slot) => (
              <li key={slot.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>
                  {formatDayLabel(slot.mealSlot.date)} · {slot.mealSlot.mealPeriod.name} · {slot.items.map((item) => formatOrderLine(item)).join(", ")} ·{" "}
                  {slot.status.toLowerCase().replaceAll("_", " ")}
                </span>
                {slot.status !== "DELIVERED" && slot.status !== "CANCELLED" ? (
                  <form action={markSlotDelivered}>
                    <input type="hidden" name="orderSlotId" value={slot.id} />
                    <button type="submit" className="h-11 rounded-lg bg-gold px-3 text-sm font-semibold text-ink">
                      Mark delivered
                    </button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <form className="flex flex-wrap items-end gap-2">
        <label className="text-sm font-medium">
          Manifest slot
          <select name="slot" defaultValue={selected?.id} className="mt-1 block h-11 max-w-full rounded-lg border border-border bg-white px-3">
            {slots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {slot.programme.code} · {formatDayLabel(slot.date)} · {slot.mealPeriod.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="h-11 rounded-lg border border-border bg-white px-4 text-sm font-semibold">
          Load manifest
        </button>
      </form>
      {selected ? (
        <div className="space-y-4">
          <h2 className="font-heading text-2xl">
            {selected.programme.title} · {formatDayLabel(selected.date)} · {selected.mealPeriod.name}
          </h2>
          <p className="text-sm text-muted-foreground">{formatWindow(selected.mealPeriod.deliveryWindowStart, selected.mealPeriod.deliveryWindowEnd)}</p>
          {[...groups.entries()].map(([point, rows]) => (
            <section key={point} className="rounded-2xl bg-white p-4 ring-1 ring-foreground/10">
              <h3 className="font-heading text-xl">{point}</h3>
              <ul className="mt-2 space-y-3">
                {rows.map((row) => (
                  <li key={row.id} className="text-sm">
                    <p className="font-semibold">
                      {row.order.attendee.fullName} · {row.order.attendee.phone} · {row.order.numberOfPeople} people · {row.status.toLowerCase().replaceAll("_", " ")}
                    </p>
                    <p>{row.items.map((item) => formatOrderLine(item)).join(", ")}</p>
                    {row.order.dietaryNotes ? <p className="text-muted-foreground">{row.order.dietaryNotes}</p> : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {manifest.length === 0 ? <p className="text-sm text-muted-foreground">No paid meals for this slot.</p> : null}
        </div>
      ) : null}
    </div>
  )
}
