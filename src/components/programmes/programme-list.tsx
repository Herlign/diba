import { ProgrammeCard } from "@/components/programmes/programme-card"
import type { ProgrammeCard as ProgrammeCardData } from "@/lib/programmes"

export function ProgrammeList({ programmes }: { programmes: ProgrammeCardData[] }) {
  if (programmes.length === 0) {
    return (
      <div className="rounded-xl bg-card px-6 py-14 text-center ring-1 ring-foreground/10">
        <h2 className="font-heading text-2xl">Nothing matches that filter</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Try another city, or clear the search to see every published programme.
        </p>
        <a href="/programmes" className="mt-4 inline-block text-sm font-medium text-primary">
          Show all programmes
        </a>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {programmes.map((programme) => (
        <ProgrammeCard key={programme.slug} programme={programme} />
      ))}
    </div>
  )
}

export function ProgrammeListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-64 rounded-xl bg-card ring-1 ring-foreground/10 motion-safe:animate-pulse"
        />
      ))}
    </div>
  )
}
