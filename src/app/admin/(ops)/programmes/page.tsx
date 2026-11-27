import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { formatDateRange } from "@/lib/dates"
import { STATUS_LABEL } from "@/lib/domain"
import { requireSection } from "@/lib/admin/require"
import { Notice } from "@/components/admin/notice"

export const instant = false

export const metadata = { title: "Programmes" }

export default async function ProgrammesAdminPage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  await requireSection("catalogue")
  const { notice, error } = await searchParams
  const programmes = await prisma.programme.findMany({
    orderBy: { startDate: "asc" },
    include: { church: true, venue: true, _count: { select: { slots: true, orders: true } } },
  })
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-4xl">Programmes</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Create a programme, set its days and meal times, and choose which dishes are served.
          </p>
        </div>
        <Link href="/admin/programmes/new" className="inline-flex h-11 items-center rounded-lg bg-palm px-4 text-sm font-semibold text-cream">
          New programme
        </Link>
      </div>
      <Notice notice={notice} error={error} />
      <ul className="mt-4 space-y-3">
        {programmes.map((programme) => (
          <li key={programme.id} className="rounded-2xl bg-white p-4 ring-1 ring-foreground/10">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-heading text-2xl">{programme.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {programme.church.name} · {programme.venue.name} · {programme.code} · {formatDateRange(programme.startDate, programme.endDate)}
                </p>
                <p className="text-sm">
                  {STATUS_LABEL[programme.status] ?? programme.status} · {programme._count.slots} slots · {programme._count.orders} orders
                </p>
              </div>
              <Link href={`/admin/programmes/${programme.id}`} className="inline-flex h-11 items-center rounded-lg bg-palm px-4 text-sm font-semibold text-cream">
                Edit
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
