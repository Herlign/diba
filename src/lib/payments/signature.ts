import { createHmac, timingSafeEqual } from "node:crypto"

export function signPaystackBody(raw: string, secret: string) {
  return createHmac("sha512", secret).update(raw).digest("hex")
}

export function verifyPaystackSignature(raw: string, signature: string | null, secret: string) {
  if (!signature || !secret) return false
  const expected = Buffer.from(signPaystackBody(raw, secret))
  const received = Buffer.from(signature)
  if (expected.length !== received.length) return false
  return timingSafeEqual(expected, received)
}
