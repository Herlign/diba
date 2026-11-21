export type PaymentEvent = {
  event: string
  reference: string
  amountKobo: number
  currency: string
}

export type OrderPaymentState = {
  status: "PENDING_PAYMENT" | "PAID" | "PARTIALLY_FULFILLED" | "FULFILLED" | "CANCELLED" | "REFUNDED"
  totalKobo: number
  paymentStatus: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED" | null
  needsReview: boolean
}

export type PaymentDecision =
  | { type: "ignore" }
  | { type: "already_applied" }
  | { type: "mark_paid" }
  | { type: "flag_review"; reason: string }

export function decideChargeSuccess(state: OrderPaymentState, event: PaymentEvent): PaymentDecision {
  if (event.event !== "charge.success") return { type: "ignore" }
  if (
    state.paymentStatus === "SUCCESS" ||
    state.status === "PAID" ||
    state.status === "PARTIALLY_FULFILLED" ||
    state.status === "FULFILLED"
  ) {
    return { type: "already_applied" }
  }
  if (state.status === "CANCELLED" || state.status === "REFUNDED") {
    return { type: "flag_review", reason: "Payment arrived after the order was closed." }
  }
  if (event.currency !== "NGN" || event.amountKobo !== state.totalKobo) {
    return { type: "flag_review", reason: "Amount or currency does not match the order." }
  }
  return { type: "mark_paid" }
}

/** Applies one event to an in-memory order. A second success does not change a paid order. */
export function nextPaymentState(state: OrderPaymentState, event: PaymentEvent) {
  const decision = decideChargeSuccess(state, event)
  if (decision.type === "mark_paid") {
    return {
      decision,
      state: { ...state, status: "PAID" as const, paymentStatus: "SUCCESS" as const, needsReview: false },
    }
  }
  if (decision.type === "flag_review") {
    return { decision, state: { ...state, needsReview: true } }
  }
  return { decision, state }
}
