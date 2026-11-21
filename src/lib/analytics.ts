export type AnalyticsEvent = "view_programme" | "add_to_cart" | "begin_checkout" | "purchase"

type DataLayer = { push: (event: Record<string, unknown>) => void }

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
    fbq?: (command: string, event: string, params?: Record<string, unknown>) => void
  }
}

export function track(event: AnalyticsEvent, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return
  const payload = { event, ...params }
  const layer = (window.dataLayer ?? []) as DataLayer & Record<string, unknown>[]
  window.dataLayer = layer
  layer.push(payload)
  window.fbq?.("trackCustom", event, params)
}
