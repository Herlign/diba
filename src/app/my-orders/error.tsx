"use client"

export default function MyOrdersError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <h1 className="font-heading text-4xl">We could not open your orders</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">Ask for a fresh link, or try this page again.</p>
      <button type="button" onClick={reset} className="mt-5 inline-flex h-12 items-center rounded-lg bg-palm px-5 text-sm font-semibold text-cream">
        Try again
      </button>
    </div>
  )
}
