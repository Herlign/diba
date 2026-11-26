import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { SERVICE_WINDOWS } from "@/lib/catalogue"
import { requireSection } from "@/lib/admin/require"
import { saveProgramme } from "@/lib/admin/programme-mutations"
import { BLOB_SETUP_MESSAGE, blobReady } from "@/lib/blob-upload"
import { Notice } from "@/components/admin/notice"
import { NameSlugFields } from "@/components/admin/name-slug-fields"

export const metadata = { title: "New programme" }

const STATUSES = [
  ["DRAFT", "Draft — hidden"],
  ["PUBLISHED", "Published — people can order"],
  ["CLOSED", "Closed — visible, ordering stopped"],
] as const

export default async function NewProgrammePage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const staff = await requireSection("catalogue")
  if (staff.role !== "SUPER_ADMIN") {
    return (
      <div>
        <h1 className="font-heading text-4xl">New programme</h1>
        <p className="mt-2 text-sm">Only the manager can add a programme.</p>
      </div>
    )
  }
  const { notice } = await searchParams
  const [churches, venues] = await Promise.all([
    prisma.church.findMany({ where: { isActive: true, archivedAt: null }, orderBy: { name: "asc" } }),
    prisma.venue.findMany({ where: { archivedAt: null }, orderBy: { name: "asc" }, include: { deliveryPoints: true } }),
  ])
  return (
    <div>
      <Link href="/admin/programmes" className="text-sm font-semibold text-palm">
        All programmes
      </Link>
      <h1 className="mt-2 font-heading text-4xl">New programme</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        A new programme starts as a draft, so it does not appear on the site until you publish it.
      </p>
      <Notice notice={notice} />
      {blobReady() ? null : <p className="mt-4 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-foreground/10">{BLOB_SETUP_MESSAGE}</p>}
      {churches.length === 0 || venues.length === 0 ? (
        <p className="mt-4 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-foreground/10">
          Add a <Link href="/admin/churches" className="font-semibold text-palm">church</Link> and a{" "}
          <Link href="/admin/venues" className="font-semibold text-palm">venue</Link> first.
        </p>
      ) : (
        <form action={saveProgramme} className="mt-4 grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-foreground/10 sm:grid-cols-2">
          <NameSlugFields nameLabel="Programme name" slugHelp="Used in the public link. It updates from the name until you edit it." />
          <label className="block text-sm">
            Short code
            <input name="code" required minLength={3} maxLength={16} placeholder="REBOOT26" className="mt-1 block h-11 w-full rounded-lg border border-border px-3 uppercase" />
            <span className="mt-1 block text-xs text-muted-foreground">People can type this, and it is printed on the poster.</span>
          </label>
          <label className="block text-sm">
            Status
            <select name="status" defaultValue="DRAFT" className="mt-1 block h-11 w-full rounded-lg border border-border px-3">
              {STATUSES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm sm:col-span-2">
            Description
            <textarea name="description" required minLength={10} maxLength={2000} rows={4} className="mt-1 block w-full rounded-lg border border-border px-3 py-2" />
          </label>
          <label className="block text-sm">
            Church
            <select name="churchId" required className="mt-1 block h-11 w-full rounded-lg border border-border px-3">
              {churches.map((church) => (
                <option key={church.id} value={church.id}>
                  {church.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Venue
            <select name="venueId" required className="mt-1 block h-11 w-full rounded-lg border border-border px-3">
              {venues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                  {venue.deliveryPoints.some((point) => point.isActive) ? "" : " (no collection point yet)"}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            First day
            <input name="startDate" type="date" required className="mt-1 block h-11 w-full rounded-lg border border-border px-3" />
          </label>
          <label className="block text-sm">
            Last day
            <input name="endDate" type="date" required className="mt-1 block h-11 w-full rounded-lg border border-border px-3" />
          </label>
          <label className="block text-sm">
            Ordering closes this many hours before
            <input name="cutoff" type="number" min={1} max={168} defaultValue={24} className="mt-1 block h-11 w-full rounded-lg border border-border px-3" />
          </label>
          <fieldset className="text-sm">
            <legend>Meal times</legend>
            {SERVICE_WINDOWS.map((window) => (
              <label key={window.key} className="mt-2 flex items-center gap-2">
                <input name="periods" type="checkbox" value={window.name} defaultChecked={window.key !== "afternoon"} className="size-5 accent-palm" />
                {window.name} ({window.short})
              </label>
            ))}
          </fieldset>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input name="offerAll" type="checkbox" defaultChecked className="size-5 accent-palm" />
            Offer every current dish at the meal times you picked
          </label>
          <label className="block text-sm sm:col-span-2">
            Cover photo
            <input name="photo" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="mt-1 block w-full text-sm" />
          </label>
          <button type="submit" className="h-11 rounded-lg bg-palm px-4 text-sm font-semibold text-cream sm:w-fit">
            Create programme
          </button>
        </form>
      )}
    </div>
  )
}
