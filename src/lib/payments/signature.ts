import { createHmac, timingSafeEqual } from "node:crypto"

/** x-payaza-signature is base64(HMAC-SHA512(raw body, PAYAZA_SECRET_KEY)). */
export function signPayazaBody(raw: string, secret: string) {
  return createHmac("sha512", secret).update(raw, "utf8").digest("base64")
}

export function verifyPayazaSignature(raw: string, signature: string | null, secret: string) {
  if (!signature || !secret) return false
  const expected = Buffer.from(signPayazaBody(raw, secret))
  const received = Buffer.from(signature.trim())
  if (expected.length !== received.length) return false
  return timingSafeEqual(expected, received)
}
