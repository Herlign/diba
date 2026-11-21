"use client"

import { useEffect } from "react"
import { track } from "@/lib/analytics"

export function TrackPurchase({ reference, value }: { reference: string; value: number }) {
  useEffect(() => {
    track("purchase", { reference, value, currency: "NGN" })
  }, [reference, value])
  return null
}
