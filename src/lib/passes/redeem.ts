import { deliveryStartFromKey, lagosDateKey } from "@/lib/ordering/rules"
import { verifyPassToken } from "@/lib/passes/token"

export const DELIVERY_TOLERANCE_MS = 45 * 60 * 1000

const PAID = new Set(["PAID", "PARTIALLY_FULFILLED", "FULFILLED"])

export type RedeemSlot = {
  id: string
  mealSlotId: string
  status: string
  orderStatus: string
  dateKey: string
  windowStart: string
  windowEnd: string
}

export function assessRedemption(input: {
  now: Date
  secret: string
  token: string
  orderSlot: RedeemSlot | null
}): { ok: true } | { ok: false; reason: string } {
  const verified = verifyPassToken(input.token, input.secret)
  if (!verified) return { ok: false, reason: "This pass is not valid." }
  if (verified.expiryUnix * 1000 < input.now.getTime()) return { ok: false, reason: "This pass has expired." }
  const slot = input.orderSlot
  if (!slot) return { ok: false, reason: "This pass is not on a live order." }
  if (slot.id !== verified.orderSlotId || slot.mealSlotId !== verified.mealSlotId) {
    return { ok: false, reason: "This pass does not match the meal." }
  }
  if (slot.status === "DELIVERED") return { ok: false, reason: "This pass was already used." }
  if (slot.status === "CANCELLED") return { ok: false, reason: "This meal was cancelled." }
  if (!PAID.has(slot.orderStatus)) return { ok: false, reason: "This order is not paid." }
  const today = lagosDateKey(input.now)
  if (slot.dateKey !== today) return { ok: false, reason: `This pass is for ${slot.dateKey}, not today.` }
  const start = deliveryStartFromKey(slot.dateKey, slot.windowStart).getTime() - DELIVERY_TOLERANCE_MS
  const end = deliveryStartFromKey(slot.dateKey, slot.windowEnd).getTime() + DELIVERY_TOLERANCE_MS
  if (input.now.getTime() < start || input.now.getTime() > end) {
    return { ok: false, reason: "This pass is outside the delivery window." }
  }
  return { ok: true }
}
