// Checkout collects a Nigerian mobile and stores E.164. Payaza's checkout sample uses +country code too.
export const PAYAZA_FALLBACK_PHONE = "+2348000000000"

export function payazaCheckoutPhone(stored: string | null | undefined) {
  const value = stored?.trim() ?? ""
  return value || PAYAZA_FALLBACK_PHONE
}

export function splitCustomerName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { firstName: "Guest", lastName: "Guest" }
  const firstName = parts[0] ?? "Guest"
  if (parts.length === 1) return { firstName, lastName: firstName }
  return { firstName, lastName: parts.slice(1).join(" ") }
}
