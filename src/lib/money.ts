/** Prices are stored as integer kobo. Display is whole naira. */
export function formatNaira(kobo: number): string {
  const naira = Math.round(kobo / 100)
  const formatted = new Intl.NumberFormat("en-NG", {
    maximumFractionDigits: 0,
  }).format(naira)
  return `₦${formatted}`
}

const MAX_NAIRA = 1_000_000

/**
 * Parse a price a person typed. Accepts 1500, 1,500, ₦1,500 and 1500.50.
 * A blank field is not zero.
 */
export function parseNairaToKobo(raw: string): number | null {
  const cleaned = raw
    .trim()
    .replace(/\u00a0/g, "")
    .replace(/₦/g, "")
    .replace(/naira/gi, "")
    .replace(/\s+/g, "")
    .replace(/,/g, "")
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null
  const naira = Number(cleaned)
  if (!Number.isFinite(naira) || naira < 0 || naira > MAX_NAIRA) return null
  return Math.round(naira * 100)
}
