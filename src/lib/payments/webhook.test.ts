import { describe, expect, it } from "vitest"
import { decideChargeSuccess, nextPaymentState, type OrderPaymentState } from "@/lib/payments/decide"
import { signPaystackBody, verifyPaystackSignature } from "@/lib/payments/signature"

const pending: OrderPaymentState = {
  status: "PENDING_PAYMENT",
  totalKobo: 700_000,
  paymentStatus: "PENDING",
  needsReview: false,
}

const paidEvent = {
  event: "charge.success",
  reference: "DM-CROSS26-00001",
  amountKobo: 700_000,
  currency: "NGN",
}

describe("webhook idempotency", () => {
  it("marks a matching charge paid once", () => {
    const first = nextPaymentState(pending, paidEvent)
    expect(first.decision).toEqual({ type: "mark_paid" })
    const second = nextPaymentState(first.state, paidEvent)
    expect(second.decision).toEqual({ type: "already_applied" })
    expect(second.state).toEqual(first.state)
  })

  it("flags a mismatched amount and does not mark the order paid", () => {
    const result = nextPaymentState(pending, { ...paidEvent, amountKobo: 100 })
    expect(result.decision).toEqual({
      type: "flag_review",
      reason: "Amount or currency does not match the order.",
    })
    expect(result.state.status).toBe("PENDING_PAYMENT")
    expect(result.state.needsReview).toBe(true)
    const again = nextPaymentState(result.state, { ...paidEvent, amountKobo: 100 })
    expect(again.decision.type).toBe("flag_review")
    expect(again.state.status).toBe("PENDING_PAYMENT")
  })

  it("rejects the wrong currency", () => {
    expect(decideChargeSuccess(pending, { ...paidEvent, currency: "USD" }).type).toBe("flag_review")
  })

  it("ignores events that are not a successful charge", () => {
    expect(decideChargeSuccess(pending, { ...paidEvent, event: "charge.failed" }).type).toBe("ignore")
  })

  it("flags a payment that arrives after the hold was cancelled", () => {
    expect(
      decideChargeSuccess({ ...pending, status: "CANCELLED" }, paidEvent),
    ).toMatchObject({ type: "flag_review" })
  })

  it("checks the Paystack signature against the raw body", () => {
    const raw = JSON.stringify({ event: "charge.success", data: { amount: 700_000 } })
    const signature = signPaystackBody(raw, "sk_test_secret")
    expect(verifyPaystackSignature(raw, signature, "sk_test_secret")).toBe(true)
    expect(verifyPaystackSignature(raw, signature, "wrong")).toBe(false)
    expect(verifyPaystackSignature(`${raw} `, signature, "sk_test_secret")).toBe(false)
    expect(verifyPaystackSignature(raw, null, "sk_test_secret")).toBe(false)
  })
})
