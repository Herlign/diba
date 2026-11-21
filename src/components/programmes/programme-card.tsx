import Link from "next/link"
import { MapPin } from "lucide-react"
import { FoodImage } from "@/components/food-image"
import { Badge } from "@/components/ui/badge"
import { formatDateRange, formatWindow } from "@/lib/dates"
import { STATUS_LABEL } from "@/lib/domain"
import { jollof, type FoodPhoto } from "@/lib/food-photos"
import { formatNaira } from "@/lib/money"
import type { ProgrammeCard as ProgrammeCardData } from "@/lib/programmes"

function statusClass(status: string) {
  if (status === "PUBLISHED") return "bg-gold text-ink"
  if (status === "CLOSED") return "bg-ink text-cream"
  return "bg-palm text-cream"
}

function coverPhoto(programme: ProgrammeCardData): FoodPhoto {
  if (!programme.coverImageUrl) return jollof
  return {
    src: programme.coverImageUrl,
    alt: `${programme.title} at ${programme.venueName}`,
    label: programme.title,
    credit: "",
    href: "",
  }
}

export function ProgrammeCard({ programme }: { programme: ProgrammeCardData }) {
  const photo = coverPhoto(programme)
  return (
    <article id={programme.slug} className="programme-card h-full scroll-mt-24">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-card text-ink shadow-[0_12px_0_0_#1a120c]">
        <div className="relative aspect-[4/3] overflow-hidden bg-gold">
          <FoodImage photo={photo} className="food-photo" />
          <Badge className={`absolute top-3 left-3 z-10 ${statusClass(programme.status)}`}>
            {STATUS_LABEL[programme.status] ?? programme.status}
          </Badge>
          <span className="absolute top-3 right-3 z-10 rounded-full bg-ink/80 px-2 py-1 text-xs font-semibold text-cream">
            {programme.code}
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-3 p-4">
          <p className="text-xs font-semibold tracking-wide text-tomato uppercase">
            {programme.churchName}
          </p>
          <h2 className="font-heading text-2xl leading-tight">{programme.title}</h2>
          <p className="text-sm leading-6 text-muted-foreground">{programme.description}</p>
          <p className="text-sm font-medium">{formatDateRange(programme.startDate, programme.endDate)}</p>
          <p className="flex items-start gap-2 text-sm">
            <MapPin className="mt-0.5 size-4 shrink-0 text-tomato" aria-hidden="true" />
            <span>{programme.venueName}</span>
          </p>
          <ul className="text-sm text-foreground/80">
            {programme.periods.map((period) => (
              <li key={period.name}>
                {period.name}: {formatWindow(period.start, period.end)}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 bg-gold px-4 py-3 text-ink">
          <span className="font-heading text-2xl">
            {programme.fromKobo === null ? "Menu soon" : formatNaira(programme.fromKobo)}
          </span>
          <Link
            href={`/programmes#${programme.slug}`}
            className="inline-flex h-11 min-w-11 items-center rounded-lg bg-ink px-4 text-sm font-semibold text-cream"
          >
            Order meals
          </Link>
        </div>
      </div>
    </article>
  )
}
