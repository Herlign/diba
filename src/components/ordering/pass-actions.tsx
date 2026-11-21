"use client"

export function PassActions({
  passes,
  shareText,
}: {
  passes: { name: string; dataUrl: string }[]
  shareText: string
}) {
  function download(pass: { name: string; dataUrl: string }) {
    const link = document.createElement("a")
    link.href = pass.dataUrl
    link.download = `${pass.name}.png`
    link.click()
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button type="button" className="inline-flex h-11 items-center rounded-lg bg-palm px-4 text-sm font-semibold text-cream" onClick={() => passes.forEach((pass, index) => setTimeout(() => download(pass), index * 150))}>
        Download all passes
      </button>
      <button type="button" className="inline-flex h-11 items-center rounded-lg border border-border px-4 text-sm font-semibold" onClick={() => window.print()}>
        Save as PDF
      </button>
      <a className="inline-flex h-11 items-center rounded-lg bg-gold px-4 text-sm font-semibold text-ink" href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}>
        Share on WhatsApp
      </a>
    </div>
  )
}
