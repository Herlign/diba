import { prisma } from "@/lib/prisma"
import { requireSection } from "@/lib/admin/require"
import { createPoint, togglePoint } from "@/lib/admin/mutations"

export const metadata = { title: "Delivery points" }

export default async function PointsPage() {
  await requireSection("catalogue")
  const venues = await prisma.venue.findMany({
    orderBy: { name: "asc" },
    include: { deliveryPoints: { orderBy: { position: "asc" } } },
  })
  return (
    <div>
      <h1 className="font-heading text-4xl">Delivery points</h1>
      {venues.map((venue) => (
        <section key={venue.id} className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-foreground/10">
          <h2 className="font-heading text-2xl">{venue.name}</h2>
          <p className="text-sm text-muted-foreground">{venue.address}</p>
          <ul className="mt-3 space-y-2">
            {venue.deliveryPoints.map((point) => (
              <li key={point.id} className="flex items-center justify-between gap-3 text-sm">
                <span>
                  {point.name}
                  {point.description ? ` — ${point.description}` : ""} · {point.isActive ? "active" : "hidden"}
                </span>
                <form action={togglePoint}>
                  <input type="hidden" name="id" value={point.id} />
                  <button type="submit" className="h-11 font-semibold text-palm">
                    {point.isActive ? "Hide" : "Show"}
                  </button>
                </form>
              </li>
            ))}
          </ul>
          <form action={createPoint} className="mt-4 flex flex-wrap gap-2">
            <input type="hidden" name="venueId" value={venue.id} />
            <input name="name" required placeholder="Point name" className="h-11 flex-1 rounded-lg border border-border px-3" />
            <input name="description" placeholder="Where to stand" className="h-11 flex-1 rounded-lg border border-border px-3" />
            <button type="submit" className="h-11 rounded-lg bg-palm px-4 text-sm font-semibold text-cream">
              Add point
            </button>
          </form>
        </section>
      ))}
    </div>
  )
}
