/** Adds a full stop when the line does not already end with one. */
export function withStop(value: string) {
  const text = value.trim()
  if (!text) return ""
  if (/[.!?…]$/.test(text)) return text
  return `${text}.`
}

/** Joins lines for a meta description without producing a double full stop. */
export function joinParts(parts: Array<string | null | undefined>) {
  return parts.map((part) => withStop(part ?? "")).filter(Boolean).join(" ")
}

/** Digits already saved win. A blank value keeps the number configured on the server. */
export function resolveWhatsappNumber(stored: string, envValue: string | undefined) {
  const fromStore = stored.replace(/\D/g, "")
  if (fromStore) return fromStore
  const fromEnv = (envValue ?? "").replace(/\D/g, "")
  return fromEnv || "2348090002210"
}

export function whatsappHref(number: string) {
  return `https://wa.me/${number}`
}

/** A new upload wins. Remove falls back to the original. Otherwise the current photo stays. */
export function nextImageUrl(options: { current: string; uploaded: string | null; remove: boolean; fallback: string }) {
  if (options.uploaded) return options.uploaded
  if (options.remove) return options.fallback
  return options.current || options.fallback
}

export function stepNumber(position: number) {
  return String(position + 1).padStart(2, "0")
}

/** Admin redirect that keeps the manager on the block they just saved. */
export function contentPath(section: string) {
  return `/admin/content?section=${section}#${section}`
}
