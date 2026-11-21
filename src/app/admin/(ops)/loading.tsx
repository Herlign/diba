export default function LoadingOps() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="h-10 w-48 rounded-lg bg-white motion-safe:animate-pulse" />
      <div className="mt-4 h-40 rounded-2xl bg-white motion-safe:animate-pulse" />
    </div>
  )
}
