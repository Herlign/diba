import { createHmac, timingSafeEqual } from "node:crypto"
import type { StaffRoleName } from "@/lib/auth/access"

export type StaffSession = {
  id: string
  email: string
  name: string
  role: StaffRoleName
  exp: number
}

export function signStaffSession(session: StaffSession, secret: string) {
  const body = Buffer.from(JSON.stringify(session)).toString("base64url")
  const mac = createHmac("sha256", secret).update(body).digest("base64url")
  return `${body}.${mac}`
}

export function readStaffSession(token: string, secret: string, now = Date.now()): StaffSession | null {
  const split = token.split(".")
  if (split.length !== 2) return null
  const [body, mac] = split
  if (!body || !mac) return null
  const expected = createHmac("sha256", secret).update(body).digest("base64url")
  const a = Buffer.from(expected)
  const b = Buffer.from(mac)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString()) as StaffSession
    if (!parsed.id || !parsed.email || !parsed.role || parsed.exp < now) return null
    return parsed
  } catch {
    return null
  }
}
