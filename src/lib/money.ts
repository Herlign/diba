/** Prices are stored as integer kobo. Display is whole naira. */
export function formatNaira(kobo: number): string {
  const naira = Math.round(kobo / 100)
  const formatted = new Intl.NumberFormat("en-NG", {
    maximumFractionDigits: 0,
  }).format(naira)
  return `₦${formatted}`
}
