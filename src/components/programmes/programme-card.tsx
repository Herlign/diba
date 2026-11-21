import { FoodImage } from "@/components/food-image"
import { Badge } from "@/components/ui/badge"
import { formatDateRange } from "@/lib/dates"
import { STATUS_LABEL } from "@/lib/domain"
import { jollof, programmePhotos } from "@/lib/food-photos"
import { formatNaira } from "@/lib/money"
import { mealRhythm, plateNames, startingPriceKobo } from "@/lib/programme-query"
import type { ProgrammeCard as ProgrammeCardData } from "@/lib/programmes"

function statusClass(status: string) {
  if (status === "ORDERING_OPEN") return "bg-gold text-ink"
  if (status === "LIVE") return "bg-tomato text-cream"
  if (status === "CANCELLED") return "bg-ink text-cream"
  if (status === "PUBLISHED") return "bg-cream text-ink"
  return "bg-palm text-cream"
}

export function ProgrammeCard({ programme }: { programme: ProgrammeCardData }) {
  const price = startingPriceKobo(programme)
  const plates = plateNames(programme, 2)
  const photo = programmePhotos[programme.slug] ?? jollof
  return (
    <article id={programme.slug} className="programme-card h-full scroll-mt-24">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-card text-ink shadow-[0_12px_0_0_#1a120c]">
        <div className="relative aspect-[4/3] overflow-hidden bg-gold">
          <FoodImage photo={photo} className="food-photo" />
          <Badge className={`absolute top-3 left-3 z-10 ${statusClass(programme.status)}`}>
            {STATUS_LABEL[programme.status] ?? programme.status}
          </Badge>
        </div>
        <div className="flex flex-1 flex-col gap-3 p-4">
          <p className="text-xs font-semibold tracking-wide text-tomato uppercase">
            {programme.ministryName}
          </p>
          <h2 className="font-heading text-2xl leading-tight">{programme.title}</h2>
          <p className="text-sm leading-6 text-muted-foreground">{programme.summary}</p>
          <p className="text-sm">
            {formatDateRange(programme.startsOn, programme.endsOn)}
            <span className="text-muted-foreground"> · {programme.city}</span>
          </p>
          <p className="text-sm text-foreground/80">{mealRhythm(programme)}</p>
          {plates.length > 0 ? <p className="text-sm font-medium">{plates.join(" · ")}</p> : null}
        </div>
        <div className="mt-auto flex items-center justify-between bg-gold px-4 py-3 text-ink">
          <span className="text-sm font-medium">Plates from</span>
          <span className="font-heading text-2xl">
            {price === null ? "Soon" : formatNaira(price)}
          </span>
        </div>
      </div>
    </article>
  )
}
