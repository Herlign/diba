"use client"

import { useState } from "react"
import { slugify } from "@/lib/slug"

export function NameSlugFields({
  defaultName = "",
  defaultSlug = "",
  nameLabel = "Name",
  slugLabel = "Short link",
  slugHelp = "Filled in from the name. Change it only if the link should be different.",
}: {
  defaultName?: string
  defaultSlug?: string
  nameLabel?: string
  slugLabel?: string
  slugHelp?: string
}) {
  const [name, setName] = useState(defaultName)
  const [slug, setSlug] = useState(defaultSlug || slugify(defaultName))
  const [slugTouched, setSlugTouched] = useState(Boolean(defaultSlug) && slugify(defaultName) !== defaultSlug)

  return (
    <>
      <label className="block text-sm">
        {nameLabel}
        <input
          name="name"
          required
          maxLength={120}
          value={name}
          onChange={(event) => {
            const next = event.target.value
            setName(next)
            if (!slugTouched) setSlug(slugify(next))
          }}
          className="mt-1 block h-11 w-full rounded-lg border border-border px-3"
        />
      </label>
      <label className="block text-sm">
        {slugLabel}
        <input
          name="slug"
          maxLength={80}
          value={slug}
          onChange={(event) => {
            setSlugTouched(true)
            setSlug(slugify(event.target.value))
          }}
          className="mt-1 block h-11 w-full rounded-lg border border-border px-3"
        />
        <span className="mt-1 block text-xs text-muted-foreground">{slugHelp}</span>
      </label>
    </>
  )
}
