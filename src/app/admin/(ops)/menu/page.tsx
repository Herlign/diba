import { prisma } from "@/lib/prisma"
import { formatNaira } from "@/lib/money"
import { SUGGESTED_PORTION_LABELS } from "@/lib/catalogue"
import { requireSection } from "@/lib/admin/require"
import { archiveItem, createVariant, removeVariant, updateVariant } from "@/lib/admin/mutations"

export const metadata = { title: "Menu" }

export default async function MenuAdminPage() {
  await requireSection("catalogue")
  const items = await prisma.menuItem.findMany({
    where: { archivedAt: null },
    orderBy: [{ category: { position: "asc" } }, { position: "asc" }],
    include: {
      category: true,
      variants: { orderBy: { position: "asc" }, include: { _count: { select: { orderItems: true } } } },
    },
  })
  return (
    <div>
      <h1 className="font-heading text-4xl">Menu</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        A plate with one size keeps that price. Add another size when a dish has two portions. Labels such as Regular and Large are saved on the size, so you can rename them. Checkout charges the price stored here.
      </p>
      <datalist id="portion-labels">
        {SUGGESTED_PORTION_LABELS.map((label) => (
          <option key={label} value={label} />
        ))}
      </datalist>
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
                <li key={variant.id} className="flex flex-wrap items-end gap-2">
                  <form action={updateVariant} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="id" value={variant.id} />
                    <label className="text-sm">
                      Label
                      <input
                        name="name"
                        required
                        maxLength={40}
                        defaultValue={variant.name}
                        list="portion-labels"
                        className="mt-1 block h-11 w-32 rounded-lg border border-border px-3"
                      />
                    </label>
                    <label className="text-sm">
                      ₦
                      <input name="naira" type="number" min={0} defaultValue={Math.round(variant.priceKobo / 100)} className="mt-1 block h-11 w-28 rounded-lg border border-border px-3" />
                    </label>
                    <label className="text-sm">
                      Order
                      <input name="position" type="number" min={0} defaultValue={variant.position} className="mt-1 block h-11 w-20 rounded-lg border border-border px-3" />
                    </label>
                    <label className="flex h-11 items-center gap-2 text-sm">
                      <input name="isAvailable" type="checkbox" defaultChecked={variant.isAvailable} className="size-5 accent-palm" />
                      Available
                    </label>
                    <span className="pb-3 text-xs text-muted-foreground">{formatNaira(variant.priceKobo)}</span>
                    <button type="submit" className="h-11 rounded-lg bg-palm px-3 text-sm font-semibold text-cream">
                      Save
                    </button>
                  </form>
                  {item.variants.length > 1 ? (
                    <form action={removeVariant}>
                      <input type="hidden" name="id" value={variant.id} />
                      <button type="submit" className="h-11 text-sm font-semibold text-tomato">
                        {variant._count.orderItems > 0 ? "Hide" : "Remove"}
                      </button>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
            <form action={createVariant} className="mt-3 flex flex-wrap items-end gap-2 border-t border-border pt-3">
              <input type="hidden" name="menuItemId" value={item.id} />
              <label className="text-sm">
                New size
                <input
                  name="name"
                  required
                  maxLength={40}
                  list="portion-labels"
                  placeholder="Large"
                  className="mt-1 block h-11 w-36 rounded-lg border border-border px-3"
                />
              </label>
              <label className="text-sm">
                ₦
                <input name="naira" type="number" min={0} required defaultValue={0} className="mt-1 block h-11 w-28 rounded-lg border border-border px-3" />
              </label>
              <button type="submit" className="h-11 rounded-lg border border-border px-3 text-sm font-semibold">
                Add size
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  )
}
