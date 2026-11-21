import { ProgrammeListSkeleton } from "@/components/programmes/programme-list"

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="h-24 max-w-xl rounded-xl bg-card motion-safe:animate-pulse" />
      <div className="mt-8">
        <ProgrammeListSkeleton />
      </div>
    </div>
  )
}
