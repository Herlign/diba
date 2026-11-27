export function Notice({ notice, error }: { notice?: string; error?: string }) {
  if (!notice) return null
  const isError = error === "1"
  return (
    <p
      className={`mt-4 rounded-lg px-3 py-2 text-sm text-ink ${isError ? "bg-tomato/10 ring-1 ring-tomato/30" : "bg-gold/40"}`}
      role={isError ? "alert" : "status"}
    >
      {notice}
    </p>
  )
}
