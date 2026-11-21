export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6" aria-busy="true" aria-live="polite">
      <div className="h-8 w-40 rounded-lg bg-white motion-safe:animate-pulse" />
      <div className="mt-4 h-16 w-2/3 rounded-lg bg-white motion-safe:animate-pulse" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="h-64 rounded-2xl bg-white motion-safe:animate-pulse" />
        <div className="h-64 rounded-2xl bg-white motion-safe:animate-pulse" />
      </div>
    </div>
  )
}
