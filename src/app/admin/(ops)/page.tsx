import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { formatNaira } from "@/lib/money"
import { formatDayLabel } from "@/lib/dates"
import { lagosDateKey } from "@/lib/ordering/rules"
import { requireSection } from "@/lib/admin/require"
import { Notice } from "@/components/admin/notice"

export const metadata = { title: "Dashboard" }

const PAID = ["PAID", "PARTIALLY_FULFILLED", "FULFILLED"] as const

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ programme?: string; notice?: string }> }) {
  const staff = await requireSection("overview")
  const { programme: programmeId, notice } = await searchParams
  const programmes = await prisma.programme.findMany({ orderBy: { startDate: "asc" }, include: { church: true } })
  const paidByProgramme = await prisma.order.groupBy({
    by: ["programmeId"],
    where: { status: { in: [...PAID] } },
    _count: true,
  })
  const busiest = [...paidByProgramme].sort((a, b) => b._count - a._count)[0]?.programmeId
  const selected =
    programmes.find((item) => item.id === programmeId) ??
    programmes.find((item) => item.id === busiest) ??
    programmes.find((item) => item.status === "PUBLISHED") ??
    programmes[0]
  const orders = selected
    ? await prisma.order.findMany({
        where: { programmeId: selected.id },
        select: { status: true, totalKobo: true, createdAt: true },
      })
    : []
  const paid = orders.filter((order) => (PAID as readonly string[]).includes(order.status))
  const revenue = paid.reduce((sum, order) => sum + order.totalKobo, 0)
  const slots = selected
    ? await prisma.mealSlot.findMany({
        where: { programmeId: selected.id },
        include: { mealPeriod: true },
        orderBy: [{ date: "asc" }, { mealPeriod: { position: "asc" } }],
      })
    : []
  const mealCounts = selected
    ? await prisma.orderSlot.groupBy({
        by: ["mealSlotId"],
        where: {
          status: { not: "CANCELLED" },
          mealSlot: { programmeId: selected.id },
          order: { status: { in: [...PAID] } },
        },
        _count: true,
      })
    : []
  const countBySlot = new Map(mealCounts.map((row) => [row.mealSlotId, row._count]))
  const byDay = new Map<string, number>()
  for (const order of paid) {
    const key = lagosDateKey(order.createdAt)
    byDay.set(key, (byDay.get(key) ?? 0) + 1)
  }
  const bars = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-10)
  const max = Math.max(1, ...bars.map(([, count]) => count))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold tracking-wide text-palm uppercase">Dashboard</p>
          <h1 className="font-heading text-4xl">{selected?.title ?? "No programmes yet"}</h1>
        </div>
        {programmes.length > 0 ? (
          <form>
            <label className="text-sm font-medium">
              Programme
              <select name="programme" defaultValue={selected?.id} className="mt-1 block h-11 rounded-lg border border-border bg-white px-3">
                {programmes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="ml-2 h-11 rounded-lg bg-palm px-3 text-sm font-semibold text-cream">
              Show
            </button>
          </form>
        ) : null}
      </div>
      <Notice notice={notice} />
      <dl className="grid gap-3 sm:grid-cols-3">
        <Stat label="Paid revenue" value={formatNaira(revenue)} />
        <Stat label="Paid orders" value={String(paid.length)} />
        <Stat label="Meals still on the book" value={String([...countBySlot.values()].reduce((sum, count) => sum + count, 0))} />
      </dl>
      <section className="rounded-2xl bg-white p-4 ring-1 ring-foreground/10">
        <h2 className="font-heading text-2xl">Orders over time</h2>
        {bars.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No paid orders yet.</p> : null}
        <div className="mt-4 flex h-36 items-end gap-2">
          {bars.map(([day, count]) => (
            <div key={day} className="flex h-full flex-1 flex-col justify-end gap-1">
              <div className="rounded-t bg-palm" style={{ height: `${Math.max(8, (count / max) * 100)}%` }} />
              <span className="text-center text-[10px] text-muted-foreground">{day.slice(5)}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-2xl bg-white p-4 ring-1 ring-foreground/10">
        <h2 className="font-heading text-2xl">Slots</h2>
        <ul className="mt-3 divide-y divide-border">
          {slots.map((slot) => (
            <li key={slot.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span>
                {formatDayLabel(slot.date)} · {slot.mealPeriod.name}
                {slot.isOpen ? "" : " · closed"}
              </span>
              <span className="font-semibold">
                {countBySlot.get(slot.id) ?? 0} / {slot.capacity ?? "∞"}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
          <Link href="/admin/kitchen" className="text-palm">
            Kitchen sheet
          </Link>
          <Link href="/admin/dispatch" className="text-palm">
            Dispatch
          </Link>
          <Link href="/admin/orders" className="text-palm">
            Orders
          </Link>
        </div>
      </section>
      {staff.role === "SUPER_ADMIN" ? (
        <section className="rounded-2xl bg-white p-4 ring-1 ring-foreground/10">
          <h2 className="font-heading text-2xl">Team</h2>
          <p className="mt-2 text-sm text-muted-foreground">Add someone, change their role, set a new password, or turn an account off.</p>
          <Link href="/admin/staff" className="mt-3 inline-flex h-11 items-center rounded-lg bg-palm px-4 text-sm font-semibold text-cream">
            Open team
          </Link>
        </section>
      ) : null}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-foreground/10">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="font-heading text-3xl">{value}</dd>
    </div>
  )
}
