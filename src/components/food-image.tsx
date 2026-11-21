"use client"

import Image from "next/image"
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
    <Image
      src={photo.src}
      alt={photo.alt}
      fill
      sizes="(max-width: 640px) 100vw, 480px"
      priority={priority}
      onError={() => setFailed(true)}
      className={cn("object-cover", className)}
      style={{ objectPosition: photo.focus ?? "center" }}
    />
  )
}
