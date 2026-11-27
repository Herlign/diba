import { prisma } from "@/lib/prisma"
import { requireSection } from "@/lib/admin/require"
import { createPromo, togglePromo } from "@/lib/admin/mutations"
import { Notice } from "@/components/admin/notice"

export const instant = false

export const metadata = { title: "Promo codes" }

export default async function PromosPage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  await requireSection("catalogue")
  const { notice, error } = await searchParams
  const [promos, programmes] = await Promise.all([
    prisma.promoCode.findMany({ orderBy: { code: "asc" }, include: { programme: true } }),
    prisma.programme.findMany({ orderBy: { title: "asc" } }),
  ])
  return (
    <div>
      <h1 className="font-heading text-4xl">Promo codes</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">A code needs 3 to 20 letters or numbers. The percent is taken off the order.</p>
      <Notice notice={notice} error={error} />
      <form action={createPromo} className="mt-4 flex flex-wrap items-end gap-2 rounded-2xl bg-white p-4 ring-1 ring-foreground/10">
        <input name="code" required placeholder="Code" className="h-11 rounded-lg border border-border px-3 uppercase" />
        <input name="percent" type="number" min={1} max={100} required placeholder="%" className="h-11 w-24 rounded-lg border border-border px-3" />
        <input name="usageLimit" type="number" min={1} placeholder="Limit" className="h-11 w-28 rounded-lg border border-border px-3" />
        <select name="programmeId" className="h-11 rounded-lg border border-border px-3">
          <option value="">Any programme</option>
          {programmes.map((programme) => (
            <option key={programme.id} value={programme.id}>
              {programme.title}
            </option>
          ))}
        </select>
        <button type="submit" className="h-11 rounded-lg bg-palm px-4 text-sm font-semibold text-cream">
          Add code
        </button>
      </form>
      <ul className="mt-4 space-y-2">
        {promos.map((promo) => (
          <li key={promo.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-foreground/10">
            <div>
              <p className="font-semibold">{promo.code}</p>
              <p className="text-sm text-muted-foreground">
                {promo.percentOff ?? 0}% · {promo.programme?.title ?? "Any programme"} · used {promo.usedCount}
                {promo.usageLimit ? ` / ${promo.usageLimit}` : ""} · {promo.isActive ? "active" : "paused"}
              </p>
            </div>
            <form action={togglePromo}>
              <input type="hidden" name="id" value={promo.id} />
              <button type="submit" className="h-11 rounded-lg border border-border px-3 text-sm font-semibold">
                {promo.isActive ? "Pause" : "Activate"}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  )
}
