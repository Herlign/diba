import { prisma } from "@/lib/prisma"
import { formatNaira } from "@/lib/money"
import { SUGGESTED_PORTION_LABELS } from "@/lib/catalogue"
import { requireSection } from "@/lib/admin/require"
import { archiveItem, createVariant, removeVariant, updateVariant } from "@/lib/admin/mutations"
import { moveCategory, restoreDish, saveCategory, saveDish } from "@/lib/admin/menu-mutations"
import { BLOB_SETUP_MESSAGE, blobReady } from "@/lib/blob-upload"
import { Notice } from "@/components/admin/notice"
import { NameSlugFields } from "@/components/admin/name-slug-fields"

export const metadata = { title: "Menu" }

const KNOWN = ["spicy", "vegetarian"] as const

export default async function MenuAdminPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  await requireSection("catalogue")
  const { notice } = await searchParams
  const [categories, items, archived] = await Promise.all([
    prisma.category.findMany({ where: { archivedAt: null }, orderBy: [{ position: "asc" }, { name: "asc" }] }),
    prisma.menuItem.findMany({
      where: { archivedAt: null },
      orderBy: [{ category: { position: "asc" } }, { position: "asc" }],
      include: {
        category: true,
        variants: { orderBy: { position: "asc" }, include: { _count: { select: { orderItems: true } } } },
      },
    }),
    prisma.menuItem.findMany({
      where: { archivedAt: { not: null } },
      orderBy: { name: "asc" },
      include: { category: true },
    }),
  ])
  const uploads = blobReady()

  return (
    <div>
      <h1 className="font-heading text-4xl">Menu</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Add a dish, change its words and photo, or bring an archived dish back. Sizes and prices are saved on each dish. Checkout charges the price stored here.
      </p>
      <Notice notice={notice} />
      {uploads ? null : <p className="mt-4 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-foreground/10">{BLOB_SETUP_MESSAGE}</p>}

      <section className="mt-6 rounded-2xl bg-white p-4 ring-1 ring-foreground/10">
        <h2 className="font-heading text-2xl">Categories</h2>
        <p className="mt-1 text-sm text-muted-foreground">Breakfast, lunch and dinner are main meals. Extras are add-ons. You can rename them.</p>
        <ul className="mt-3 space-y-3">
          {categories.map((category, index) => (
            <li key={category.id} className="flex flex-wrap items-end gap-2 border-b border-border pb-3">
              <form action={saveCategory} className="flex flex-1 flex-wrap items-end gap-2">
                <input type="hidden" name="id" value={category.id} />
                <label className="text-sm">
                  Name
                  <input name="name" required defaultValue={category.name} className="mt-1 block h-11 w-40 rounded-lg border border-border px-3" />
                </label>
                <label className="text-sm">
                  Link
                  <input name="slug" required defaultValue={category.slug} className="mt-1 block h-11 w-40 rounded-lg border border-border px-3" />
                </label>
                <button type="submit" className="h-11 rounded-lg bg-palm px-3 text-sm font-semibold text-cream">
                  Save
                </button>
              </form>
              <form action={moveCategory} className="flex gap-1">
                <input type="hidden" name="id" value={category.id} />
                {index > 0 ? (
                  <button name="direction" value="up" className="h-11 rounded-lg border border-border px-3 text-sm font-semibold">
                    Up
                  </button>
                ) : null}
                {index < categories.length - 1 ? (
                  <button name="direction" value="down" className="h-11 rounded-lg border border-border px-3 text-sm font-semibold">
                    Down
                  </button>
                ) : null}
              </form>
            </li>
          ))}
        </ul>
        <form action={saveCategory} className="mt-3 flex flex-wrap items-end gap-2">
          <label className="text-sm">
            New category
            <input name="name" required placeholder="Snacks" className="mt-1 block h-11 w-48 rounded-lg border border-border px-3" />
          </label>
          <button type="submit" className="h-11 rounded-lg border border-border px-3 text-sm font-semibold">
            Add category
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-2xl bg-white p-4 ring-1 ring-foreground/10">
        <h2 className="font-heading text-2xl">New dish</h2>
        <form action={saveDish} className="mt-3 grid gap-3 sm:grid-cols-2">
          <NameSlugFields nameLabel="Dish name" slugHelp="The menu link. It updates from the name until you edit it." />
          <label className="block text-sm sm:col-span-2">
            Description
            <textarea name="description" required maxLength={500} rows={3} className="mt-1 block w-full rounded-lg border border-border px-3 py-2" />
          </label>
          <label className="block text-sm">
            Category
            <select name="categoryId" required className="mt-1 block h-11 w-full rounded-lg border border-border px-3">
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Price (₦)
            <input name="naira" type="number" min={0} required defaultValue={0} className="mt-1 block h-11 w-full rounded-lg border border-border px-3" />
          </label>
          <label className="block text-sm">
            Position
            <input name="position" type="number" min={0} defaultValue={items.length} className="mt-1 block h-11 w-full rounded-lg border border-border px-3" />
          </label>
          <fieldset className="text-sm">
            <legend>Dietary tags</legend>
            <label className="mt-2 flex items-center gap-2">
              <input name="tag-spicy" type="checkbox" className="size-5 accent-palm" /> Spicy
            </label>
            <label className="mt-2 flex items-center gap-2">
              <input name="tag-vegetarian" type="checkbox" className="size-5 accent-palm" /> Vegetarian
            </label>
          </fieldset>
          <label className="block text-sm sm:col-span-2">
            Other tags
            <input name="tags" placeholder="halal, nuts" className="mt-1 block h-11 w-full rounded-lg border border-border px-3" />
          </label>
          <label className="block text-sm sm:col-span-2">
            Photo
            <input name="photo" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="mt-1 block w-full text-sm" />
          </label>
          <button type="submit" className="h-11 rounded-lg bg-palm px-4 text-sm font-semibold text-cream sm:col-span-2 sm:w-fit">
            Add dish
          </button>
        </form>
      </section>

      <datalist id="portion-labels">
        {SUGGESTED_PORTION_LABELS.map((label) => (
          <option key={label} value={label} />
        ))}
      </datalist>
      <ul className="mt-6 space-y-4">
        {items.map((item) => {
          const extraTags = item.dietaryTags.filter((tag) => !KNOWN.includes(tag as (typeof KNOWN)[number])).join(", ")
          return (
            <li key={item.id} id={`dish-${item.id}`} className="rounded-2xl bg-white p-4 ring-1 ring-foreground/10">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.imageUrl} alt="" width={64} height={64} className="size-16 rounded-lg object-cover" />
                  <div>
                    <h2 className="font-heading text-2xl">{item.name}</h2>
                    <p className="text-sm text-muted-foreground">{item.category.name}</p>
                  </div>
                </div>
                <form action={archiveItem}>
                  <input type="hidden" name="id" value={item.id} />
                  <button type="submit" className="h-11 text-sm font-semibold text-tomato">
                    Archive
                  </button>
                </form>
              </div>
              <form action={saveDish} className="mt-3 grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="currentImage" value={item.imageUrl} />
                <NameSlugFields defaultName={item.name} defaultSlug={item.slug} nameLabel="Dish name" />
                <label className="block text-sm sm:col-span-2">
                  Description
                  <textarea name="description" required maxLength={500} rows={3} defaultValue={item.description} className="mt-1 block w-full rounded-lg border border-border px-3 py-2" />
                </label>
                <label className="block text-sm">
                  Category
                  <select name="categoryId" defaultValue={item.categoryId} className="mt-1 block h-11 w-full rounded-lg border border-border px-3">
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  Position
                  <input name="position" type="number" min={0} defaultValue={item.position} className="mt-1 block h-11 w-full rounded-lg border border-border px-3" />
                </label>
                <fieldset className="text-sm">
                  <legend>Dietary tags</legend>
                  <label className="mt-2 flex items-center gap-2">
                    <input name="tag-spicy" type="checkbox" defaultChecked={item.dietaryTags.includes("spicy")} className="size-5 accent-palm" /> Spicy
                  </label>
                  <label className="mt-2 flex items-center gap-2">
                    <input name="tag-vegetarian" type="checkbox" defaultChecked={item.dietaryTags.includes("vegetarian")} className="size-5 accent-palm" /> Vegetarian
                  </label>
                </fieldset>
                <label className="block text-sm">
                  Other tags
                  <input name="tags" defaultValue={extraTags} className="mt-1 block h-11 w-full rounded-lg border border-border px-3" />
                </label>
                <label className="block text-sm sm:col-span-2">
                  Replace photo
                  <input name="photo" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="mt-1 block w-full text-sm" />
                </label>
                <button type="submit" className="h-11 rounded-lg bg-palm px-4 text-sm font-semibold text-cream sm:w-fit">
                  Save dish
                </button>
              </form>
              <ul className="mt-3 space-y-2">
                {item.variants.map((variant) => (
                  <li key={variant.id} className="flex flex-wrap items-end gap-2">
                    <form action={updateVariant} className="flex flex-wrap items-end gap-2">
                      <input type="hidden" name="id" value={variant.id} />
                      <label className="text-sm">
                        Label
                        <input name="name" required maxLength={40} defaultValue={variant.name} list="portion-labels" className="mt-1 block h-11 w-32 rounded-lg border border-border px-3" />
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
                  <input name="name" required maxLength={40} list="portion-labels" placeholder="Large" className="mt-1 block h-11 w-36 rounded-lg border border-border px-3" />
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
          )
        })}
      </ul>

      <section className="mt-6">
        <h2 className="font-heading text-2xl">Archived dishes</h2>
        {archived.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Nothing is archived.</p> : null}
        <ul className="mt-3 space-y-2">
          {archived.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-foreground/10">
              <p>
                {item.name} <span className="text-sm text-muted-foreground">{item.category.name}</span>
              </p>
              <form action={restoreDish}>
                <input type="hidden" name="id" value={item.id} />
                <button type="submit" className="h-11 rounded-lg bg-palm px-3 text-sm font-semibold text-cream">
                  Restore
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
