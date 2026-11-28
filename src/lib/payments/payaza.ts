import "server-only"
import { nairaToKobo } from "@/lib/money"

// Merchant-reference status query. OpenAPI and the Node SDK authenticate with the public key, base64-encoded.
// PAYAZA_SECRET_KEY signs webhooks only. The /live path is fixed for test and live.
const STATUS_URL =
  "https://api.payaza.africa/live/merchant-collection/transfer_notification_controller/merchant/transaction-query"

export type PayazaTransaction = {
  status: string
  amountKobo: number
  currency: string
  merchantReference: string
}

type StatusBody = {
  success?: boolean
  data?: {
    amount_received?: number
    transaction_status?: string
    currency?: string
    merchant_transaction_reference?: string | number | null
  }
}

export function payazaConnectionMode(): "Test" | "Live" {
  return process.env.NEXT_PUBLIC_PAYAZA_MODE === "Live" ? "Live" : "Test"
}

export function payazaPublicKey() {
  return process.env.NEXT_PUBLIC_PAYAZA_PUBLIC_KEY?.trim() || null
}

export function isPayazaPaid(status: string) {
  return status.trim().toLowerCase() === "completed"
}

export function payazaReferenceCandidates(body: {
  merchant_reference?: unknown
  transaction_reference?: unknown
}) {
  const seen = new Set<string>()
  const references: string[] = []
  for (const value of [body.merchant_reference, body.transaction_reference]) {
    if (typeof value !== "string" && typeof value !== "number") continue
    const reference = String(value).trim()
    if (!reference || seen.has(reference)) continue
    seen.add(reference)
    references.push(reference)
  }
  return references
}

function authorizationHeader() {
  const publicKey = payazaPublicKey()
  if (!publicKey) throw new Error("NEXT_PUBLIC_PAYAZA_PUBLIC_KEY is not set")
  return `Payaza ${Buffer.from(publicKey).toString("base64")}`
}

export async function fetchPayazaTransaction(reference: string): Promise<PayazaTransaction | null> {
  const url = new URL(STATUS_URL)
  url.searchParams.set("merchant_reference", reference)
  const response = await fetch(url, {
    headers: {
      Authorization: authorizationHeader(),
      "X-TenantID": payazaConnectionMode() === "Live" ? "live" : "test",
    },
    cache: "no-store",
  })
  if (response.status >= 500) throw new Error("Payaza status query failed")
  if (!response.ok) return null
  const body = (await response.json()) as StatusBody
  const amount = body.data?.amount_received
  if (body.success === false || typeof amount !== "number" || !Number.isFinite(amount) || amount < 0) return null
  return {
    status: body.data?.transaction_status ?? "",
    amountKobo: nairaToKobo(amount),
    currency: (body.data?.currency ?? "").toUpperCase(),
    merchantReference: String(body.data?.merchant_transaction_reference ?? reference),
  }
}

export async function loadPayazaTransaction(reference: string) {
  let latest: PayazaTransaction | null = null
  for (let attempt = 0; attempt < 3; attempt += 1) {
    latest = await fetchPayazaTransaction(reference)
    const status = latest?.status.trim().toLowerCase() ?? ""
    if (status === "completed" || status === "failed") return latest
    if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 800))
  }
  return latest
}
