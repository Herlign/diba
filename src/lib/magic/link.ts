import { createHmac, timingSafeEqual } from "node:crypto"

const TWO_HOURS_MS = 2 * 60 * 60 * 1000

export function signMagicLink(email: string, secret: string, now = Date.now()) {
  const body = Buffer.from(JSON.stringify({ email: email.toLowerCase(), exp: now + TWO_HOURS_MS })).toString("base64url")
  const mac = createHmac("sha256", secret).update(body).digest("base64url")
  return `${body}.${mac}`
}

export function verifyMagicLink(token: string, secret: string, now = Date.now()) {
  const split = token.split(".")
  if (split.length !== 2) return null
  const [body, mac] = split
  if (!body || !mac) return null
  const expected = createHmac("sha256", secret).update(body).digest("base64url")
  const a = Buffer.from(expected)
  const b = Buffer.from(mac)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString()) as { email?: string; exp?: number }
    if (!parsed.email || typeof parsed.exp !== "number" || parsed.exp < now) return null
    return { email: parsed.email }
  } catch {
    return null
  }
}
