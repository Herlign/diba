"use client"

import Link from "next/link"
import { useState } from "react"
import { formatNaira } from "@/lib/money"
import { requestSlotRefund } from "@/lib/orders/actions"

type Slot = {
  id: string
  label: string
  status: string
  refundRequested: boolean
  cancellable: boolean
  closedLabel: string
  items: string[]
}

type OrderCard = {
  reference: string
  accessToken: string
  status: string
  totalKobo: number
  needsReview: boolean
  title: string
  deliveryPoint: string
  slots: Slot[]
}

export function MyOrdersList({ email, orders }: { email: string; orders: OrderCard[] }) {
  return (
    <div className="bg-white pb-16 text-ink">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <p className="text-sm font-semibold tracking-wide text-palm uppercase">My orders</p>
        <h1 className="mt-2 font-heading text-3xl break-all sm:text-4xl">{email}</h1>
        {orders.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">Nothing is booked on this email yet.</p> : null}
        <div className="mt-6 space-y-5">
          {orders.map((order) => (
            <OrderBlock key={order.reference} order={order} />
          ))}
        </div>
      </div>
    </div>
  )
}

function OrderBlock({ order }: { order: OrderCard }) {
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [slots, setSlots] = useState(order.slots)
  const [pending, setPending] = useState<string | null>(null)

  return (
    <article className="rounded-2xl bg-white p-4 ring-1 ring-foreground/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl">{order.title}</h2>
          <p className="text-sm text-muted-foreground">
            {order.reference} · {order.status.replaceAll("_", " ").toLowerCase()} · {order.deliveryPoint}
          </p>
        </div>
        <p className="font-heading text-2xl">{formatNaira(order.totalKobo)}</p>
      </div>
      {order.needsReview ? <p className="mt-3 text-sm text-tomato">This payment is waiting for a review.</p> : null}
      <ul className="mt-4 space-y-3">
        {slots.map((slot) => (
          <li key={slot.id} className="rounded-xl bg-[#f7f6f3] p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{slot.label}</p>
                <p className="text-sm text-muted-foreground">{slot.items.join(", ")}</p>
                <p className="text-xs text-muted-foreground">{slot.refundRequested ? "Refund requested" : slot.status.replaceAll("_", " ").toLowerCase()}</p>
              </div>
              {slot.cancellable && !slot.refundRequested ? (
                <button
                  type="button"
                  className="h-11 text-sm font-semibold text-tomato"
                  onClick={() => {
                    if (pending === slot.id) {
                      void requestSlotRefund(order.reference, order.accessToken, slot.id).then((result) => {
                        setPending(null)
                        if (!result.ok) {
                          setNotes((current) => ({ ...current, [slot.id]: result.error }))
                          return
                        }
                        setSlots((current) =>
                          current.map((item) =>
                            item.id === slot.id ? { ...item, refundRequested: true, cancellable: false, status: "CANCELLED" } : item,
                          ),
                        )
                        setNotes((current) => ({ ...current, [slot.id]: result.message }))
                      })
                      return
                    }
                    setPending(slot.id)
                  }}
                >
                  {pending === slot.id ? "Confirm refund request" : "Cancel this meal"}
                </button>
              ) : null}
            </div>
            {notes[slot.id] ? <p className="mt-2 text-sm">{notes[slot.id]}</p> : null}
            {slot.cancellable ? <p className="mt-1 text-xs text-muted-foreground">Open until {slot.closedLabel}.</p> : null}
          </li>
        ))}
      </ul>
      <Link href={`/orders/${order.reference}?token=${order.accessToken}`} className="mt-4 inline-flex h-11 items-center text-sm font-semibold text-palm">
        Meal passes
      </Link>
    </article>
  )
}
