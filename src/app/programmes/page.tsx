import { Suspense } from "react"
import { Search } from "lucide-react"
import { ProgrammeCard } from "@/components/programmes/programme-card"
import { ProgrammeListSkeleton } from "@/components/programmes/programme-list"
import { parseQuery } from "@/lib/domain"
import { listProgrammes } from "@/lib/programmes"

export const metadata = {
  title: "Programmes",
  description:
    "Find a church programme by name or code and see where Diba Meals is delivering.",
  openGraph: {
    title: "Programmes · Diba Meals",
    description: "Crossover conventions, retreats and camp meetings taking meal orders.",
  },
}

export default function ProgrammesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  return (
    <div>
      <header className="border-b border-border bg-white text-ink">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <p className="text-sm font-semibold tracking-wide text-palm uppercase">The board</p>
          <h1 className="mt-2 max-w-2xl font-heading text-4xl leading-tight sm:text-5xl">
            Find your programme
          </h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">
            Search by church, programme name, or the code on the poster. Ordering for a meal closes 24 hours before it is delivered.
          </p>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Suspense fallback={<ProgrammeListSkeleton />}>
          <ProgrammeResults searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  )
}

async function ProgrammeResults({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const params = await searchParams
  const q = parseQuery(params.q)
  const programmes = await listProgrammes(q)
  const noun = programmes.length === 1 ? "programme" : "programmes"

  return (
    <div className="space-y-6">
      <form action="/programmes" method="get" className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="programme-search">
          Find your programme
        </label>
        <div className="flex min-h-12 flex-1 items-center gap-2 rounded-lg border border-input bg-card px-3">
          <Search className="size-4 shrink-0" aria-hidden="true" />
          <input
            id="programme-search"
            name="q"
            defaultValue={q}
            placeholder="Church, programme name, or code"
            className="h-12 w-full bg-transparent text-base outline-none"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-12 items-center justify-center rounded-lg bg-palm px-5 text-sm font-semibold text-cream"
        >
          Search
        </button>
        {q ? (
          <a href="/programmes" className="inline-flex h-12 items-center text-sm font-semibold text-tomato">
            Clear
          </a>
        ) : null}
      </form>
      <p className="text-sm text-muted-foreground">
        {programmes.length} {noun}
        {q ? ` matching “${q}”` : ""}
      </p>
      {programmes.length === 0 ? (
        <div className="rounded-2xl bg-card px-6 py-14 text-center ring-1 ring-foreground/10">
          <h2 className="font-heading text-2xl">No programme matches that</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Try the code on the church poster, or clear the search.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {programmes.map((programme) => (
            <ProgrammeCard key={programme.slug} programme={programme} />
          ))}
        </div>
      )}
    </div>
  )
}
