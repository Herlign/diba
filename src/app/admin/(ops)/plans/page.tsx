import { prisma } from "@/lib/prisma"
import { requireSection } from "@/lib/admin/require"
import { updatePlan } from "@/lib/admin/mutations"
import { Notice } from "@/components/admin/notice"

export const instant = false

export const metadata = { title: "Meal plans" }

export default async function PlansAdminPage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  await requireSection("catalogue")
  const { notice, error } = await searchParams
  const plans = await prisma.mealPlan.findMany({
    where: { archivedAt: null },
    orderBy: [{ programme: { startDate: "asc" } }, { position: "asc" }],
    include: { programme: true },
  })
  return (
    <div>
      <h1 className="font-heading text-4xl">Meal plans</h1>
      <Notice notice={notice} error={error} />
      <ul className="mt-4 space-y-3">
        {plans.map((plan) => (
          <li key={plan.id} className="rounded-2xl bg-white p-4 ring-1 ring-foreground/10">
            <h2 className="font-heading text-2xl">{plan.name}</h2>
            <p className="text-sm text-muted-foreground">
              {plan.programme.title} · {plan.pricingMode.toLowerCase().replaceAll("_", " ")}
            </p>
            <form action={updatePlan} className="mt-3 flex flex-wrap items-end gap-3">
              <input type="hidden" name="id" value={plan.id} />
              <label className="text-sm">
                Percent off
                <input name="discountPercent" type="number" min={0} max={100} defaultValue={plan.discountPercent ?? ""} className="mt-1 block h-11 w-28 rounded-lg border border-border px-3" />
              </label>
              <label className="text-sm">
                Fixed ₦ / slot
                <input name="fixedNaira" inputMode="decimal" autoComplete="off" placeholder="1,500" defaultValue={plan.fixedPricePerSlotKobo ? plan.fixedPricePerSlotKobo / 100 : ""} className="mt-1 block h-11 w-32 rounded-lg border border-border px-3" />
              </label>
              <label className="flex h-11 items-center gap-2 text-sm">
                <input name="isActive" type="checkbox" defaultChecked={plan.isActive} className="size-5 accent-palm" />
                Active
              </label>
              <button type="submit" className="h-11 rounded-lg bg-palm px-4 text-sm font-semibold text-cream">
                Save plan
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  )
}
