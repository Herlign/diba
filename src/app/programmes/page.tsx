import { Suspense } from "react"
import { ProgrammeFilters } from "@/components/programmes/programme-filters"
import { ProgrammeList, ProgrammeListSkeleton } from "@/components/programmes/programme-list"
import { parseListStatus } from "@/lib/domain"
import { listProgrammes, listPublicCities } from "@/lib/programmes"

export const metadata = {
  title: "Programmes",
  description: "Church programmes taking plates from Diba Meals.",
}

type Search = {
  status?: string
  city?: string
  q?: string
}

export default function ProgrammesPage({
  searchParams,
}: {
  searchParams: Promise<Search>
}) {
  return (
    <div>
      <header className="bg-tomato text-cream">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <p className="text-sm font-semibold tracking-wide text-gold uppercase">
            The board
          </p>
          <h1 className="mt-2 max-w-2xl font-heading text-4xl leading-tight sm:text-5xl">
            Who&apos;s eating this week
          </h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-cream/90">
            If your programme is here, the pot is real. The list locks at 6pm the day before — the kitchen does not do &quot;just add one more.&quot;
          </p>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Suspense fallback={<ListingFallback />}>
          <ProgrammeResults searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  )
}

async function ProgrammeResults({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams
  const status = parseListStatus(params.status)
  const city = typeof params.city === "string" ? params.city : "all"
  const q = typeof params.q === "string" ? params.q : ""
  const [programmes, cities] = await Promise.all([
    listProgrammes({ status, city, q }),
    listPublicCities(),
  ])
  const noun = programmes.length === 1 ? "programme" : "programmes"

  return (
    <div className="space-y-6">
      <ProgrammeFilters status={status} city={city} q={q} cities={cities} />
      <p className="text-sm text-muted-foreground">
        {programmes.length} {noun}
        {q.trim() ? ` matching “${q.trim()}”` : ""}
      </p>
      <ProgrammeList programmes={programmes} />
    </div>
  )
}

function ListingFallback() {
  return (
    <div className="space-y-6">
      <div className="h-16 rounded-xl bg-card ring-1 ring-foreground/10 motion-safe:animate-pulse" />
      <ProgrammeListSkeleton />
    </div>
  )
}
