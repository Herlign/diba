import QRCode from "qrcode"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { formatDayLabel } from "@/lib/dates"
import { requireSection } from "@/lib/admin/require"
import { siteUrl } from "@/lib/site"
import { updateProgramme, updateSlot } from "@/lib/admin/mutations"

export const metadata = { title: "Programme" }

export default async function ProgrammeAdminPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSection("catalogue")
  const { id } = await params
  const programme = await prisma.programme.findUnique({
    where: { id },
    include: { slots: { include: { mealPeriod: true }, orderBy: [{ date: "asc" }, { mealPeriod: { position: "asc" } }] } },
  })
  if (!programme) notFound()
  const share = `${siteUrl()}/c/${programme.code}`
  const poster = await QRCode.toDataURL(share, { margin: 1, width: 320 })
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-4xl">{programme.title}</h1>
        <p className="text-sm text-muted-foreground">{share}</p>
      </div>
      <form action={updateProgramme} className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 ring-1 ring-foreground/10">
        <input type="hidden" name="id" value={programme.id} />
        <label className="text-sm font-medium">
          Status
          <select name="status" defaultValue={programme.status} className="mt-1 block h-11 rounded-lg border border-border px-3">
            {["DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"].map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Cutoff hours
          <input name="cutoff" type="number" min={1} max={168} defaultValue={programme.orderCutoffHours} className="mt-1 block h-11 w-28 rounded-lg border border-border px-3" />
        </label>
        <button type="submit" className="h-11 rounded-lg bg-palm px-4 text-sm font-semibold text-cream">
          Save programme
        </button>
      </form>
      <section className="rounded-2xl bg-white p-4 text-center ring-1 ring-foreground/10">
        <h2 className="font-heading text-2xl">Poster for the church</h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={poster} alt={`QR poster for ${programme.code}`} width={320} height={320} className="mx-auto mt-3 rounded-lg bg-white" />
        <p className="text-sm text-muted-foreground">Print this. It opens {programme.code}.</p>
      </section>
      <ul className="space-y-2">
        {programme.slots.map((slot) => (
          <li key={slot.id}>
            <form action={updateSlot} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-foreground/10">
              <input type="hidden" name="id" value={slot.id} />
              <p className="min-w-40 text-sm font-semibold">
                {formatDayLabel(slot.date)} · {slot.mealPeriod.name}
              </p>
              <label className="text-sm">
                Capacity
                <input name="capacity" type="number" min={0} defaultValue={slot.capacity ?? 0} className="ml-2 h-11 w-24 rounded-lg border border-border px-3" />
              </label>
              <label className="flex h-11 items-center gap-2 text-sm">
                <input name="isOpen" type="checkbox" defaultChecked={slot.isOpen} className="size-5 accent-palm" />
                Open
              </label>
              <button type="submit" className="h-11 rounded-lg border border-border px-3 text-sm font-semibold">
                Save slot
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  )
}
