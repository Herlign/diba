export function Notice({ notice }: { notice?: string }) {
  if (!notice) return null
  return (
    <p className="mt-4 rounded-lg bg-gold/40 px-3 py-2 text-sm text-ink" role="status">
      {notice}
    </p>
  )
}
