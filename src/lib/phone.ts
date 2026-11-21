/** Accepts 080…, +234… and 234… and returns E.164, or null when it is not a Nigerian mobile. */
export function normaliseNigerianPhone(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, "")
  let local = digits
  if (local.startsWith("+234")) local = local.slice(4)
  else if (local.startsWith("234")) local = local.slice(3)
  else if (local.startsWith("0")) local = local.slice(1)
  if (!/^[789]\d{9}$/.test(local)) return null
  return `+234${local}`
}
