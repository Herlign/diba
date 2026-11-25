import { prisma } from "@/lib/prisma"
import { formatDayLabel } from "@/lib/dates"
import { requireSection } from "@/lib/admin/require"
import { prepSheet } from "@/lib/kitchen/prep"
import { orderLineLabel } from "@/lib/ordering/line-label"
import { PrintButton } from "@/components/admin/print-button"

export const metadata = { title: "Kitchen sheet" }

const PAID = ["PAID", "PARTIALLY_FULFILLED", "FULFILLED"] as const

export default async function KitchenPage({ searchParams }: { searchParams: Promise<{ slot?: string }> }) {
  await requireSection("kitchen")
  const { slot: slotId } = await searchParams
  const slots = await prisma.mealSlot.findMany({
    include: { mealPeriod: true, programme: true },
    orderBy: [{ date: "asc" }, { mealPeriod: { position: "asc" } }],
  })
  const selected = slots.find((slot) => slot.id === slotId) ?? slots[0]
  const rows = selected
    ? await prisma.orderSlot.findMany({
        where: {
          mealSlotId: selected.id,
          order: { status: { in: [...PAID] } },
        },
        include: { items: true, order: { include: { attendee: true } } },
      })
    : []
  const sheet = prepSheet(
    rows.map((row) => ({
      slotStatus: row.status,
      attendee: row.order.attendee.fullName,
      notes: row.order.dietaryNotes,
      items: row.items.map((item) => ({ name: orderLineLabel(item), quantity: item.quantity })),
    })),
  )
  return (
    <div>
      <div className="ops-chrome flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-heading text-4xl">Kitchen sheet</h1>
        {selected ? (
          <a href={`/admin/kitchen/export?slot=${selected.id}`} className="inline-flex h-11 items-center rounded-lg bg-gold px-4 text-sm font-semibold text-ink">
            Export CSV
          </a>
        ) : null}
      </div>
      <form className="ops-chrome mt-4 flex flex-wrap items-end gap-2">
        <label className="text-sm font-medium">
          Meal slot
          <select name="slot" defaultValue={selected?.id} className="mt-1 block h-11 max-w-full rounded-lg border border-border bg-white px-3">
            {slots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {slot.programme.code} · {formatDayLabel(slot.date)} · {slot.mealPeriod.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="h-11 rounded-lg bg-palm px-4 text-sm font-semibold text-cream">
          Show
        </button>
      </form>
      <PrintButton />
      {selected ? (
        <article className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-foreground/10">
          <h2 className="font-heading text-3xl">
            {selected.programme.title}
            <span className="mt-1 block text-xl">
              {formatDayLabel(selected.date)} · {selected.mealPeriod.name}
            </span>
          </h2>
          <p className="mt-2 text-sm">{sheet.meals} meals to plate</p>
          <table className="mt-4 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2">Plate</th>
                <th className="py-2 text-right">Count</th>
              </tr>
            </thead>
            <tbody>
              {sheet.lines.map((line) => (
                <tr key={line.name} className="border-b border-border">
                  <td className="py-2">{line.name}</td>
                  <td className="py-2 text-right font-heading text-2xl">{line.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {sheet.lines.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Nothing paid for this slot.</p> : null}
          {sheet.notes.length > 0 ? (
            <div className="mt-4">
              <h3 className="font-semibold">Dietary notes</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {sheet.notes.map((note) => (
                  <li key={`${note.attendee}-${note.notes}`}>
                    {note.attendee}: {note.notes}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </article>
      ) : null}
    </div>
  )
}
