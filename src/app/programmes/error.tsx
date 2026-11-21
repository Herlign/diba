"use client"

import { Button } from "@/components/ui/button"

export default function ProgrammesError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="font-heading text-4xl">We couldn&apos;t load programmes</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
        The list didn&apos;t come back. Try again, and if this is a fresh checkout, confirm the database has been migrated and seeded.
      </p>
      <Button type="button" onClick={reset} className="mt-6 h-10 px-4" size="lg">
        Try again
      </Button>
    </div>
  )
}
