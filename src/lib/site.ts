export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:4317").replace(/\/$/, "")
}

export function paymentsMode(): "mock" | "live" {
  return process.env.PAYMENTS_MODE === "live" ? "live" : "mock"
}
