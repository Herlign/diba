import { prisma } from "@/lib/prisma"
import { formatNaira } from "@/lib/money"
import { requireSection } from "@/lib/admin/require"
import { archiveItem, updateVariant } from "@/lib/admin/mutations"

export const metadata = { title: "Menu" }

export default async function MenuAdminPage() {
  await requireSection("catalogue")
  const items = await prisma.menuItem.findMany({
    where: { archivedAt: null },
    orderBy: [{ category: { position: "asc" } }, { position: "asc" }],
    include: { category: true, variants: { orderBy: { position: "asc" } } },
  })
  return (
    <div>
      <h1 className="font-heading text-4xl">Menu</h1>
      <p className="mt-2 text-sm text-muted-foreground">Prices are what checkout charges. Archiving hides an item. It is not deleted.</p>
      <ul className="mt-4 space-y-4">
        {items.map((item) => (
          <li key={item.id} className="rounded-2xl bg-white p-4 ring-1 ring-foreground/10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-heading text-2xl">{item.name}</h2>
                <p className="text-sm text-muted-foreground">{item.category.name}</p>
              </div>
              <form action={archiveItem}>
                <input type="hidden" name="id" value={item.id} />
                <button type="submit" className="h-11 text-sm font-semibold text-tomato">
                  Archive
                </button>
              </form>
            </div>
            <ul className="mt-3 space-y-2">
              {item.variants.map((variant) => (
                <li key={variant.id}>
                  <form action={updateVariant} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={variant.id} />
                    <span className="min-w-28 text-sm font-medium">{variant.name}</span>
                    <label className="text-sm">
                      ₦
                      <input name="naira" type="number" min={0} defaultValue={Math.round(variant.priceKobo / 100)} className="ml-1 h-11 w-28 rounded-lg border border-border px-3" />
                    </label>
                    <label className="flex h-11 items-center gap-2 text-sm">
                      <input name="isAvailable" type="checkbox" defaultChecked={variant.isAvailable} className="size-5 accent-palm" />
                      Available
                    </label>
                    <span className="text-xs text-muted-foreground">{formatNaira(variant.priceKobo)}</span>
                    <button type="submit" className="h-11 rounded-lg bg-palm px-3 text-sm font-semibold text-cream">
                      Save
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  )
}
