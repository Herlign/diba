import "server-only"

export async function initialisePaystack(input: {
  email: string
  amountKobo: number
  reference: string
  callbackUrl: string
}) {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) throw new Error("PAYSTACK_SECRET_KEY is not set")
  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo,
      currency: "NGN",
      reference: input.reference,
      callback_url: input.callbackUrl,
    }),
  })
  const body = (await response.json()) as {
    status?: boolean
    message?: string
    data?: { access_code?: string; authorization_url?: string }
  }
  if (!response.ok || !body.status || !body.data?.access_code) {
    throw new Error(body.message || "Paystack did not start the payment")
  }
  return {
    accessCode: body.data.access_code,
    authorizationUrl: body.data.authorization_url ?? "",
  }
}

export async function fetchPaystackTransaction(reference: string) {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) throw new Error("PAYSTACK_SECRET_KEY is not set")
  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
    cache: "no-store",
  })
  const body = (await response.json()) as {
    data?: { status?: string; amount?: number; currency?: string; reference?: string }
  }
  if (!response.ok || !body.data) return null
  return {
    status: body.data.status ?? "",
    amountKobo: body.data.amount ?? 0,
    currency: body.data.currency ?? "",
    reference: body.data.reference ?? reference,
  }
}
