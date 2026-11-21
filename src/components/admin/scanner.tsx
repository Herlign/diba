"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { redeemPass } from "@/lib/admin/mutations"

type Result = { ok: true; headline: string; detail: string } | { ok: false; reason: string }

export function PassScanner() {
  const router = useRouter()
  const [result, setResult] = useState<Result | null>(null)
  const [cameraError, setCameraError] = useState("")
  const [busy, setBusy] = useState(false)

  async function check(token: string) {
    const trimmed = token.trim()
    if (!trimmed) return
    setBusy(true)
    const next = await redeemPass(trimmed)
    setResult(next)
    setBusy(false)
    if (next.ok) router.refresh()
  }

  async function startCamera() {
    setCameraError("")
    try {
      const { Html5Qrcode } = await import("html5-qrcode")
      const scanner = new Html5Qrcode("qr-reader")
      await scanner.start(
        { facingMode: "environment" },
        { fps: 8, qrbox: 220 },
        (text) => {
          void scanner.stop().catch(() => undefined)
          void check(text)
        },
        () => undefined,
      )
    } catch {
      setCameraError("The camera isn't available. Paste the pass or look up the reference.")
    }
  }

  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-foreground/10">
      <h2 className="font-heading text-2xl">Scan a pass</h2>
      <div id="qr-reader" className="mt-3 min-h-24 overflow-hidden rounded-xl bg-[#f7f6f3]" />
      <button type="button" onClick={() => void startCamera()} className="mt-3 inline-flex h-11 items-center rounded-lg bg-palm px-4 text-sm font-semibold text-cream">
        Use camera
      </button>
      {cameraError ? <p className="mt-2 text-sm text-tomato">{cameraError}</p> : null}
      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault()
          void check(String(new FormData(event.currentTarget).get("token") ?? ""))
        }}
      >
        <label className="sr-only" htmlFor="pass-token">
          Pass token
        </label>
        <input id="pass-token" name="token" placeholder="Paste a pass token" className="h-12 flex-1 rounded-lg border border-border bg-white px-3" />
        <button type="submit" disabled={busy} className="inline-flex h-12 items-center rounded-lg bg-gold px-4 text-sm font-semibold text-ink disabled:opacity-40">
          {busy ? "Checking…" : "Check pass"}
        </button>
      </form>
      {result?.ok ? (
        <p className="mt-4 rounded-xl bg-[#eef6f1] px-4 py-3 text-sm text-palm">
          <span className="block font-heading text-2xl text-ink">✓ {result.headline}</span>
          {result.detail}
        </p>
      ) : null}
      {result && !result.ok ? <p className="mt-4 rounded-xl bg-[#fff4f2] px-4 py-3 text-sm text-tomato">{result.reason}</p> : null}
    </section>
  )
}
