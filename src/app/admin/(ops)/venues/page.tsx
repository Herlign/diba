import { prisma } from "@/lib/prisma"
import { requireSection } from "@/lib/admin/require"
import { createPoint, savePoint, saveVenue, togglePoint } from "@/lib/admin/place-mutations"
import { Notice } from "@/components/admin/notice"

export const instant = false

export const metadata = { title: "Venues" }

export default async function VenuesPage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  await requireSection("catalogue")
  const { notice, error } = await searchParams
  const venues = await prisma.venue.findMany({
    orderBy: { name: "asc" },
    include: { deliveryPoints: { orderBy: { position: "asc" } }, _count: { select: { programmes: true } } },
  })
  return (
    <div>
      <h1 className="font-heading text-4xl">Venues</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        A venue is where the programme meets. Collection points are the places inside it where meals are dropped. Checkout needs at least one.
      </p>
      <Notice notice={notice} error={error} />

      <form action={saveVenue} className="mt-4 grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-foreground/10 sm:grid-cols-2">
        <h2 className="font-heading text-2xl sm:col-span-2">New venue</h2>
        <label className="block text-sm">
          Name
          <input name="name" required className="mt-1 block h-11 w-full rounded-lg border border-border px-3" />
        </label>
        <label className="block text-sm">
          Address
          <input name="address" required className="mt-1 block h-11 w-full rounded-lg border border-border px-3" />
        </label>
        <label className="block text-sm sm:col-span-2">
          Notes
          <input name="notes" placeholder="Where drivers should stop" className="mt-1 block h-11 w-full rounded-lg border border-border px-3" />
        </label>
        <label className="block text-sm">
          First collection point
          <input name="pointName" placeholder="Main gate" className="mt-1 block h-11 w-full rounded-lg border border-border px-3" />
        </label>
        <label className="block text-sm">
          Where to stand
          <input name="pointDescription" className="mt-1 block h-11 w-full rounded-lg border border-border px-3" />
        </label>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input name="available" type="checkbox" defaultChecked className="size-5 accent-palm" />
          Available for new programmes
        </label>
        <button type="submit" className="h-11 rounded-lg bg-palm px-4 text-sm font-semibold text-cream sm:w-fit">
          Add venue
        </button>
      </form>

      <ul className="mt-4 space-y-4">
        {venues.map((venue) => (
          <li key={venue.id} id={`venue-${venue.id}`} className="rounded-2xl bg-white p-4 ring-1 ring-foreground/10">
            <p className="text-sm text-muted-foreground">{venue._count.programmes} programmes</p>
            <form action={saveVenue} className="mt-2 grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="id" value={venue.id} />
              <label className="block text-sm">
                Name
                <input name="name" required defaultValue={venue.name} className="mt-1 block h-11 w-full rounded-lg border border-border px-3" />
              </label>
              <label className="block text-sm">
                Address
                <input name="address" required defaultValue={venue.address} className="mt-1 block h-11 w-full rounded-lg border border-border px-3" />
              </label>
              <label className="block text-sm sm:col-span-2">
                Notes
                <input name="notes" defaultValue={venue.notes ?? ""} className="mt-1 block h-11 w-full rounded-lg border border-border px-3" />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input name="available" type="checkbox" defaultChecked={!venue.archivedAt} className="size-5 accent-palm" />
                Available for new programmes
              </label>
              <button type="submit" className="h-11 rounded-lg bg-palm px-4 text-sm font-semibold text-cream sm:w-fit">
                Save venue
              </button>
            </form>
            <h3 className="mt-4 font-heading text-xl">Collection points</h3>
            <ul className="mt-2 space-y-2">
              {venue.deliveryPoints.map((point) => (
                <li key={point.id} className="flex flex-wrap items-end gap-2">
                  <form action={savePoint} className="flex flex-1 flex-wrap items-end gap-2">
                    <input type="hidden" name="id" value={point.id} />
                    <label className="text-sm">
                      Name
                      <input name="name" required defaultValue={point.name} className="mt-1 block h-11 w-44 rounded-lg border border-border px-3" />
                    </label>
                    <label className="text-sm">
                      Where to stand
                      <input name="description" defaultValue={point.description} className="mt-1 block h-11 w-56 rounded-lg border border-border px-3" />
                    </label>
                    <button type="submit" className="h-11 rounded-lg border border-border px-3 text-sm font-semibold">
                      Save
                    </button>
                  </form>
                  <form action={togglePoint}>
                    <input type="hidden" name="id" value={point.id} />
                    <button type="submit" className="h-11 text-sm font-semibold text-palm">
                      {point.isActive ? "Hide" : "Show"}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
            <form action={createPoint} className="mt-3 flex flex-wrap gap-2">
              <input type="hidden" name="venueId" value={venue.id} />
              <input name="name" required placeholder="Point name" className="h-11 flex-1 rounded-lg border border-border px-3" />
              <input name="description" placeholder="Where to stand" className="h-11 flex-1 rounded-lg border border-border px-3" />
              <button type="submit" className="h-11 rounded-lg bg-palm px-4 text-sm font-semibold text-cream">
                Add point
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  )
}
