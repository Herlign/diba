import type { Metadata } from "next"
import { Suspense } from "react"
import { Search } from "lucide-react"
import { ProgrammeCard } from "@/components/programmes/programme-card"
import { ProgrammeListSkeleton } from "@/components/programmes/programme-list"
import { parseQuery } from "@/lib/domain"
import { listProgrammes } from "@/lib/programmes"
import { getSiteContent, type SiteCopy } from "@/lib/site-content"

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent()
  return {
    title: "Programmes",
    description: content.boardMetaDescription,
    openGraph: {
      title: `Programmes · ${content.siteName}`,
      description: content.boardShareDescription,
    },
  }
}

export default async function ProgrammesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const content = await getSiteContent()
  return (
    <div>
      <header className="border-b border-border bg-white text-ink">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <p className="text-sm font-semibold tracking-wide text-palm uppercase">{content.boardEyebrow}</p>
          <h1 className="mt-2 max-w-2xl font-heading text-4xl leading-tight sm:text-5xl">{content.boardTitle}</h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">{content.boardIntro}</p>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Suspense fallback={<ProgrammeListSkeleton />}>
          <ProgrammeResults searchParams={searchParams} content={content} />
        </Suspense>
      </div>
    </div>
  )
}

async function ProgrammeResults({
  searchParams,
  content,
}: {
  searchParams: Promise<{ q?: string }>
  content: SiteCopy
}) {
  const params = await searchParams
  const q = parseQuery(params.q)
  const programmes = await listProgrammes(q)
  const noun = programmes.length === 1 ? "programme" : "programmes"

  return (
    <div className="space-y-6">
      <form action="/programmes" method="get" className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="programme-search">
          {content.boardTitle}
        </label>
        <div className="flex min-h-12 flex-1 items-center gap-2 rounded-lg border border-input bg-card px-3">
          <Search className="size-4 shrink-0" aria-hidden="true" />
          <input
            id="programme-search"
            name="q"
            defaultValue={q}
            placeholder={content.boardPlaceholder}
            className="h-12 w-full bg-transparent text-base outline-none"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-12 items-center justify-center rounded-lg bg-palm px-5 text-sm font-semibold text-cream"
        >
          {content.boardSearch}
        </button>
        {q ? (
          <a href="/programmes" className="inline-flex h-12 items-center text-sm font-semibold text-tomato">
            {content.boardClear}
          </a>
        ) : null}
      </form>
      <p className="text-sm text-muted-foreground">
        {programmes.length} {noun}
        {q ? ` matching “${q}”` : ""}
      </p>
      {programmes.length === 0 ? (
        <div className="rounded-2xl bg-card px-6 py-14 text-center ring-1 ring-foreground/10">
          <h2 className="font-heading text-2xl">{content.boardEmptyTitle}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{content.boardEmptyBody}</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {programmes.map((programme) => (
            <ProgrammeCard
              key={programme.slug}
              programme={programme}
              orderLabel={content.orderButton}
              menuSoon={content.menuSoon}
            />
          ))}
        </div>
      )}
    </div>
  )
}
