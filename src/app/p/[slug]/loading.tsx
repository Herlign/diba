export default function LoadingProgramme() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6" aria-busy="true" aria-live="polite">
      <div className="h-10 w-2/3 rounded-lg bg-[#f3f1ec] motion-safe:animate-pulse" />
      <div className="mt-6 h-48 rounded-2xl bg-[#f3f1ec] motion-safe:animate-pulse" />
      <p className="mt-4 text-sm text-muted-foreground">Loading the menu…</p>
    </div>
  )
}
