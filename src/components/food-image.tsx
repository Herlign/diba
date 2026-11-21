"use client"

import { useState } from "react"
import type { FoodPhoto } from "@/lib/food-photos"
import { cn } from "@/lib/utils"

export function FoodImage({
  photo,
  priority = false,
  className,
}: {
  photo: FoodPhoto
  sizes?: string
  priority?: boolean
  className?: string
}) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center bg-[linear-gradient(145deg,#f5b301_0%,#f26b21_48%,#c81d25_100%)] p-4 text-center",
          className,
        )}
        role="img"
        aria-label={photo.alt}
      >
        <span className="font-heading text-3xl leading-none text-ink">{photo.label}</span>
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- failed photos need an onError fallback
    <img
      src={photo.src}
      alt={photo.alt}
      loading={priority ? "eager" : "eager"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      onError={() => setFailed(true)}
      className={cn("absolute inset-0 h-full w-full object-cover", className)}
      style={{ objectPosition: photo.focus ?? "center" }}
    />
  )
}
