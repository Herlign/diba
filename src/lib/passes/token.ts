import { createHmac, timingSafeEqual } from "node:crypto"

export function signPassToken(orderSlotId: string, mealSlotId: string, expiryUnix: number, secret: string) {
  const payload = `${orderSlotId}.${mealSlotId}.${expiryUnix}`
  const mac = createHmac("sha256", secret).update(payload).digest("base64url")
  return `${payload}.${mac}`
}

export function verifyPassToken(token: string, secret: string) {
  const parts = token.split(".")
  if (parts.length !== 4) return null
  const [orderSlotId, mealSlotId, expiryRaw, mac] = parts
  if (!orderSlotId || !mealSlotId || !expiryRaw || !mac) return null
  const expiryUnix = Number(expiryRaw)
  if (!Number.isFinite(expiryUnix)) return null
  const expected = createHmac("sha256", secret).update(`${orderSlotId}.${mealSlotId}.${expiryRaw}`).digest("base64url")
  const a = Buffer.from(expected)
  const b = Buffer.from(mac)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  return { orderSlotId, mealSlotId, expiryUnix }
}
