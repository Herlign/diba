import { prisma } from "@/lib/prisma"
import { requireSection } from "@/lib/admin/require"
import { saveChurch } from "@/lib/admin/place-mutations"
import { BLOB_SETUP_MESSAGE, blobReady } from "@/lib/blob-upload"
import { Notice } from "@/components/admin/notice"
import { NameSlugFields } from "@/components/admin/name-slug-fields"

export const instant = false

export const metadata = { title: "Churches" }

export default async function ChurchesPage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  await requireSection("catalogue")
  const { notice, error } = await searchParams
  const churches = await prisma.church.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { programmes: true } } } })
  return (
    <div>
      <h1 className="font-heading text-4xl">Churches</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        A programme belongs to a church. Hiding a church keeps its existing programmes, and stops it appearing on new ones.
      </p>
      <Notice notice={notice} error={error} />
      {blobReady() ? null : <p className="mt-4 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-foreground/10">{BLOB_SETUP_MESSAGE}</p>}

      <form action={saveChurch} className="mt-4 grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-foreground/10 sm:grid-cols-2">
        <h2 className="font-heading text-2xl sm:col-span-2">New church</h2>
        <NameSlugFields />
        <label className="block text-sm">
          Phone
          <input name="contactPhone" required className="mt-1 block h-11 w-full rounded-lg border border-border px-3" />
        </label>
        <label className="block text-sm">
          Email
          <input name="contactEmail" type="email" required className="mt-1 block h-11 w-full rounded-lg border border-border px-3" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input name="isActive" type="checkbox" defaultChecked className="size-5 accent-palm" />
          Available for new programmes
        </label>
        <label className="block text-sm sm:col-span-2">
          Logo
          <input name="photo" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="mt-1 block w-full text-sm" />
        </label>
        <button type="submit" className="h-11 rounded-lg bg-palm px-4 text-sm font-semibold text-cream sm:w-fit">
          Add church
        </button>
      </form>

      <ul className="mt-4 space-y-4">
        {churches.map((church) => (
          <li key={church.id} id={`church-${church.id}`} className="rounded-2xl bg-white p-4 ring-1 ring-foreground/10">
            <p className="text-sm text-muted-foreground">{church._count.programmes} programmes</p>
            <form action={saveChurch} className="mt-2 grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="id" value={church.id} />
              <input type="hidden" name="currentImage" value={church.logoUrl ?? ""} />
              <NameSlugFields defaultName={church.name} defaultSlug={church.slug} />
              <label className="block text-sm">
                Phone
                <input name="contactPhone" required defaultValue={church.contactPhone} className="mt-1 block h-11 w-full rounded-lg border border-border px-3" />
              </label>
              <label className="block text-sm">
                Email
                <input name="contactEmail" type="email" required defaultValue={church.contactEmail} className="mt-1 block h-11 w-full rounded-lg border border-border px-3" />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input name="isActive" type="checkbox" defaultChecked={church.isActive && !church.archivedAt} className="size-5 accent-palm" />
                Available for new programmes
              </label>
              <label className="block text-sm">
                Replace logo
                <input name="photo" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="mt-1 block w-full text-sm" />
              </label>
              <button type="submit" className="h-11 rounded-lg bg-palm px-4 text-sm font-semibold text-cream sm:w-fit">
                Save
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  )
}
