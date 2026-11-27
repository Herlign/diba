import Link from "next/link"
import QRCode from "qrcode"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { formatDayLabel } from "@/lib/dates"
import { SERVICE_WINDOWS } from "@/lib/catalogue"
import { isoDate } from "@/lib/calendar"
import { requireSection } from "@/lib/admin/require"
import { siteUrl } from "@/lib/site"
import { updateSlot } from "@/lib/admin/mutations"
import { addDay, addPeriod, removeDay, removePeriod, saveOfferings, savePeriod, saveProgramme } from "@/lib/admin/programme-mutations"
import { BLOB_SETUP_MESSAGE, blobReady } from "@/lib/blob-upload"
import { Notice } from "@/components/admin/notice"
import { NameSlugFields } from "@/components/admin/name-slug-fields"

export const instant = false

export const metadata = { title: "Programme" }

const STATUSES = [
  ["DRAFT", "Draft — hidden"],
  ["PUBLISHED", "Published — people can order"],
  ["CLOSED", "Closed — visible, ordering stopped"],
  ["ARCHIVED", "Archived — hidden"],
] as const

export default async function ProgrammeAdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ notice?: string; error?: string }>
}) {
  await requireSection("catalogue")
  const { id } = await params
  const { notice, error } = await searchParams
  const programme = await prisma.programme.findUnique({
    where: { id },
    include: {
      church: true,
      venue: { include: { deliveryPoints: true } },
      mealPeriods: { orderBy: { position: "asc" } },
      slots: {
        include: { mealPeriod: true, _count: { select: { orderSlots: true } } },
        orderBy: [{ date: "asc" }, { mealPeriod: { position: "asc" } }],
      },
      menuItems: { include: { periods: true } },
    },
  })
  if (!programme) notFound()
  const [churches, venues, dishes] = await Promise.all([
    prisma.church.findMany({
      where: { OR: [{ isActive: true, archivedAt: null }, { id: programme.churchId }] },
      orderBy: { name: "asc" },
    }),
    prisma.venue.findMany({
      where: { OR: [{ archivedAt: null }, { id: programme.venueId }] },
      orderBy: { name: "asc" },
    }),
    prisma.menuItem.findMany({
      where: { archivedAt: null, isActive: true },
      orderBy: [{ category: { position: "asc" } }, { position: "asc" }],
      include: { category: true, variants: { orderBy: { position: "asc" } } },
    }),
  ])
  const share = `${siteUrl()}/c/${programme.code}`
  const poster = await QRCode.toDataURL(share, { margin: 1, width: 320 })
  const offeringByVariant = new Map(programme.menuItems.map((item) => [item.variantId, item]))
  const days: { key: string; label: string; slots: typeof programme.slots }[] = []
  for (const slot of programme.slots) {
    const key = isoDate(slot.date)
    const group = days.find((day) => day.key === key)
    if (group) group.slots.push(slot)
    else days.push({ key, label: formatDayLabel(slot.date), slots: [slot] })
  }
  const missingWindows = SERVICE_WINDOWS.filter((window) => !programme.mealPeriods.some((period) => period.name === window.name))
  const categories = [...new Map(dishes.map((dish) => [dish.categoryId, dish.category])).values()]
  const activePoint = programme.venue.deliveryPoints.some((point) => point.isActive)

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/programmes" className="text-sm font-semibold text-palm">
          All programmes
        </Link>
        <h1 className="mt-2 font-heading text-4xl">{programme.title}</h1>
        <p className="text-sm text-muted-foreground">{share}</p>
      </div>
      <Notice notice={notice} error={error} />
      {blobReady() ? null : <p className="rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-foreground/10">{BLOB_SETUP_MESSAGE}</p>}
      {activePoint ? null : (
        <p className="rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-foreground/10">
          This venue has no collection point yet. Add one under <Link href="/admin/venues" className="font-semibold text-palm">Venues</Link> before people check out.
        </p>
      )}

      <form action={saveProgramme} className="grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-foreground/10 sm:grid-cols-2">
        <input type="hidden" name="id" value={programme.id} />
        <input type="hidden" name="currentImage" value={programme.coverImageUrl ?? ""} />
        <NameSlugFields defaultName={programme.title} defaultSlug={programme.slug} nameLabel="Programme name" />
        <label className="block text-sm">
          Short code
          <input name="code" required minLength={3} maxLength={16} defaultValue={programme.code} className="mt-1 block h-11 w-full rounded-lg border border-border px-3 uppercase" />
        </label>
        <label className="block text-sm">
          Status
          <select name="status" defaultValue={programme.status} className="mt-1 block h-11 w-full rounded-lg border border-border px-3">
            {STATUSES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm sm:col-span-2">
          Description
          <textarea name="description" required minLength={10} maxLength={2000} rows={4} defaultValue={programme.description} className="mt-1 block w-full rounded-lg border border-border px-3 py-2" />
        </label>
        <label className="block text-sm">
          Church
          <select name="churchId" defaultValue={programme.churchId} className="mt-1 block h-11 w-full rounded-lg border border-border px-3">
            {churches.map((church) => (
              <option key={church.id} value={church.id}>
                {church.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Venue
          <select name="venueId" defaultValue={programme.venueId} className="mt-1 block h-11 w-full rounded-lg border border-border px-3">
            {venues.map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          First day
          <input name="startDate" type="date" required defaultValue={isoDate(programme.startDate)} className="mt-1 block h-11 w-full rounded-lg border border-border px-3" />
        </label>
        <label className="block text-sm">
          Last day
          <input name="endDate" type="date" required defaultValue={isoDate(programme.endDate)} className="mt-1 block h-11 w-full rounded-lg border border-border px-3" />
        </label>
        <label className="block text-sm">
          Ordering closes this many hours before
          <input name="cutoff" type="number" min={1} max={168} defaultValue={programme.orderCutoffHours} className="mt-1 block h-11 w-full rounded-lg border border-border px-3" />
        </label>
        <label className="block text-sm">
          Replace cover photo
          <input name="photo" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="mt-1 block w-full text-sm" />
        </label>
        <button type="submit" className="h-11 rounded-lg bg-palm px-4 text-sm font-semibold text-cream sm:w-fit">
          Save programme
        </button>
      </form>

      <section className="rounded-2xl bg-white p-4 ring-1 ring-foreground/10">
        <h2 className="font-heading text-2xl">Meal times</h2>
        <p className="mt-1 text-sm text-muted-foreground">Morning, afternoon and evening. Change the delivery window if this programme runs at different hours.</p>
        <ul className="mt-3 space-y-3">
          {programme.mealPeriods.map((period) => (
            <li key={period.id} className="flex flex-wrap items-end gap-2">
              <form action={savePeriod} className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="id" value={period.id} />
                <p className="min-w-24 pb-3 text-sm font-semibold">{period.name}</p>
                <label className="text-sm">
                  From
                  <input name="start" type="time" required defaultValue={period.deliveryWindowStart} className="mt-1 block h-11 rounded-lg border border-border px-3" />
                </label>
                <label className="text-sm">
                  To
                  <input name="end" type="time" required defaultValue={period.deliveryWindowEnd} className="mt-1 block h-11 rounded-lg border border-border px-3" />
                </label>
                <button type="submit" className="h-11 rounded-lg bg-palm px-3 text-sm font-semibold text-cream">
                  Save times
                </button>
              </form>
              <form action={removePeriod}>
                <input type="hidden" name="id" value={period.id} />
                <button type="submit" className="h-11 text-sm font-semibold text-tomato">
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
        {missingWindows.length > 0 ? (
          <form action={addPeriod} className="mt-3 flex flex-wrap items-end gap-2">
            <input type="hidden" name="programmeId" value={programme.id} />
            <label className="text-sm">
              Add a meal time
              <select name="name" className="mt-1 block h-11 rounded-lg border border-border px-3">
                {missingWindows.map((window) => (
                  <option key={window.key} value={window.name}>
                    {window.name} ({window.short})
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="h-11 rounded-lg border border-border px-3 text-sm font-semibold">
              Add
            </button>
          </form>
        ) : null}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-heading text-2xl">Days</h2>
          <form action={addDay} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="programmeId" value={programme.id} />
            <label className="text-sm">
              Add a day
              <input name="date" type="date" required className="mt-1 block h-11 rounded-lg border border-border px-3" />
            </label>
            <button type="submit" className="h-11 rounded-lg bg-palm px-3 text-sm font-semibold text-cream">
              Add day
            </button>
          </form>
        </div>
        {days.map((day) => (
          <section key={day.key} className="rounded-2xl bg-white p-4 ring-1 ring-foreground/10">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-heading text-2xl">{day.label}</h3>
              <form action={removeDay}>
                <input type="hidden" name="programmeId" value={programme.id} />
                <input type="hidden" name="date" value={day.key} />
                <button type="submit" className="h-11 text-sm font-semibold text-tomato">
                  Remove this day
                </button>
              </form>
            </div>
            <ul className="mt-2 space-y-2">
              {day.slots.map((slot) => (
                <li key={slot.id}>
                  <form action={updateSlot} className="flex flex-wrap items-center gap-3">
                    <input type="hidden" name="id" value={slot.id} />
                    <p className="min-w-28 text-sm font-semibold">{slot.mealPeriod.name}</p>
                    <label className="text-sm">
                      Capacity
                      <input name="capacity" type="number" min={0} defaultValue={slot.capacity ?? 0} className="ml-2 h-11 w-24 rounded-lg border border-border px-3" />
                    </label>
                    <label className="flex h-11 items-center gap-2 text-sm">
                      <input name="isOpen" type="checkbox" defaultChecked={slot.isOpen} className="size-5 accent-palm" />
                      Open
                    </label>
                    {slot._count.orderSlots > 0 ? <span className="text-xs text-muted-foreground">{slot._count.orderSlots} orders</span> : null}
                    <button type="submit" className="h-11 rounded-lg border border-border px-3 text-sm font-semibold">
                      Save slot
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-2xl">Dishes on this programme</h2>
        <p className="text-sm text-muted-foreground">Tick a size, then tick the meal times it can be ordered in. Leave the special price blank to use the menu price. 1500 and 1,500 are the same amount.</p>
        {categories.map((category) => (
          <details key={category.id} className="rounded-2xl bg-white p-4 ring-1 ring-foreground/10" open>
            <summary className="cursor-pointer font-heading text-2xl">{category.name}</summary>
            <div className="mt-3 space-y-4">
              {dishes
                .filter((dish) => dish.categoryId === category.id)
                .map((dish) => (
                  <form key={dish.id} action={saveOfferings} className="border-t border-border pt-3">
                    <input type="hidden" name="programmeId" value={programme.id} />
                    <h3 className="font-semibold">{dish.name}</h3>
                    <ul className="mt-2 space-y-2">
                      {dish.variants.map((variant) => {
                        const offering = offeringByVariant.get(variant.id)
                        const periodIds = new Set(offering?.periods.map((period) => period.mealPeriodId) ?? [])
                        return (
                          <li key={variant.id} className="flex flex-wrap items-center gap-3 text-sm">
                            <input type="hidden" name="variantId" value={variant.id} />
                            <label className="flex items-center gap-2">
                              <input name={`offered-${variant.id}`} type="checkbox" defaultChecked={Boolean(offering?.isActive)} className="size-5 accent-palm" />
                              {variant.name}
                              {variant.isAvailable ? "" : " (hidden on the menu)"}
                            </label>
                            {programme.mealPeriods.map((period) => (
                              <label key={period.id} className="flex items-center gap-2">
                                <input name={`period-${variant.id}`} type="checkbox" value={period.id} defaultChecked={periodIds.has(period.id)} className="size-5 accent-palm" />
                                {period.name}
                              </label>
                            ))}
                            <label>
                              Special price ₦
                              <input
                                name={`price-${variant.id}`}
                                inputMode="decimal"
                                autoComplete="off"
                                placeholder={String(Math.round(variant.priceKobo / 100))}
                                defaultValue={offering?.priceKoboOverride != null ? Math.round(offering.priceKoboOverride / 100) : ""}
                                className="ml-2 h-11 w-28 rounded-lg border border-border px-3"
                              />
                            </label>
                          </li>
                        )
                      })}
                    </ul>
                    <button type="submit" className="mt-2 h-11 rounded-lg bg-palm px-3 text-sm font-semibold text-cream">
                      Save {dish.name}
                    </button>
                  </form>
                ))}
            </div>
          </details>
        ))}
      </section>

      <section className="rounded-2xl bg-white p-4 text-center ring-1 ring-foreground/10">
        <h2 className="font-heading text-2xl">Poster for the church</h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={poster} alt={`QR poster for ${programme.code}`} width={320} height={320} className="mx-auto mt-3 rounded-lg bg-white" />
        <p className="text-sm text-muted-foreground">Print this. It opens {programme.code}.</p>
      </section>
    </div>
  )
}
