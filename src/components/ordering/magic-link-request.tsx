"use client"

import { useState } from "react"
import { requestMagicLink } from "@/lib/orders/actions"

export function MagicLinkRequest({
  error,
  eyebrow = "My orders",
  title = "Find the meals you booked",
  body = "Use the email from checkout. We'll send a link that opens every order on that address. It lasts 2 hours.",
  emailLabel = "Email",
  button = "Email me a link",
  sending = "Sending…",
}: {
  error?: string
  eyebrow?: string
  title?: string
  body?: string
  emailLabel?: string
  button?: string
  sending?: string
}) {
  const [message, setMessage] = useState(error ?? "")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  return (
    <div className="bg-white text-ink">
      <form
        className="rise mx-auto max-w-xl px-4 py-12 sm:px-6"
        onSubmit={(event) => {
          event.preventDefault()
          const email = String(new FormData(event.currentTarget).get("email") ?? "")
          setPending(true)
          void requestMagicLink(email).then((result) => {
            setPending(false)
            if (!result.ok) {
              setMessage(result.error)
              setPreviewUrl(null)
              return
            }
            setMessage(result.message)
            setPreviewUrl(result.previewUrl)
          })
        }}
      >
        <p className="text-sm font-semibold tracking-wide text-palm uppercase">{eyebrow}</p>
        <h1 className="mt-2 font-heading text-4xl">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p>
        <label className="mt-6 block text-sm font-medium">
          {emailLabel}
          <input name="email" type="email" required autoComplete="email" className="mt-1 h-12 w-full rounded-lg border border-border bg-white px-3" />
        </label>
        <button type="submit" disabled={pending} className="mt-4 inline-flex h-12 items-center rounded-lg bg-palm px-5 text-sm font-semibold text-cream disabled:opacity-40">
          {pending ? sending : button}
        </button>
        {message ? <p className="mt-4 text-sm">{message}</p> : null}
        {previewUrl ? (
          <a href={previewUrl} className="mt-3 inline-flex h-12 items-center rounded-lg bg-gold px-4 text-sm font-semibold text-ink">
            Open my orders
          </a>
        ) : null}
      </form>
    </div>
  )
}
