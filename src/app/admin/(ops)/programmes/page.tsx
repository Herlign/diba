import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { formatDateRange } from "@/lib/dates"
import { requireSection } from "@/lib/admin/require"

export const metadata = { title: "Programmes" }

export default async function ProgrammesAdminPage() {
  await requireSection("catalogue")
  const programmes = await prisma.programme.findMany({
    orderBy: { startDate: "asc" },
    include: { church: true, _count: { select: { slots: true, orders: true } } },
  })
  return (
    <div>
      <h1 className="font-heading text-4xl">Programmes</h1>
      <ul className="mt-4 space-y-3">
        {programmes.map((programme) => (
          <li key={programme.id} className="rounded-2xl bg-white p-4 ring-1 ring-foreground/10">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-heading text-2xl">{programme.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {programme.church.name} · {programme.code} · {formatDateRange(programme.startDate, programme.endDate)}
                </p>
                <p className="text-sm">
                  {programme.status.toLowerCase()} · {programme._count.slots} slots · {programme._count.orders} orders
                </p>
              </div>
              <Link href={`/admin/programmes/${programme.id}`} className="inline-flex h-11 items-center rounded-lg bg-palm px-4 text-sm font-semibold text-cream">
                Slots and link
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
