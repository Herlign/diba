"use client"

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="ops-chrome mt-3 inline-flex h-11 items-center rounded-lg border border-border bg-white px-4 text-sm font-semibold"
    >
      Print sheet
    </button>
  )
}
