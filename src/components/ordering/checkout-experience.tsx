"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useCart, useCartHydrated } from "@/lib/cart/store"
import { formatNaira } from "@/lib/money"
import { confirmMockPayment, placeOrder, verifyPayment } from "@/lib/checkout/actions"
import { track } from "@/lib/analytics"

type DeliveryPoint = { id: string; name: string; description: string }

type Programme = {
  id: string
  slug: string
  title: string
  cutoffHours: number
  deliveryPoints: DeliveryPoint[]
}

type Sheet = {
  mode: "mock" | "live"
  reference: string
  totalKobo: number
  email: string
  publicKey: string | null
  href: string
}

export function CheckoutExperience({ programme, sheet }: { programme: Programme; sheet: Sheet | null }) {
  const router = useRouter()
  const ready = useCartHydrated()
  const cart = useCart((state) => state.carts[programme.id])
  const clearProgramme = useCart((state) => state.clearProgramme)
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)
  const [paying, setPaying] = useState(false)

  const payload = {
    planId: cart?.planId ?? null,
    slots: Object.entries(cart?.items ?? {}).map(([mealSlotId, items]) => ({ mealSlotId, items })),
  }
  const hasItems = payload.slots.some((slot) => slot.items.length > 0)
  useEffect(() => {
    if (ready && hasItems && !sheet) track("begin_checkout", { slug: programme.slug })
  }, [ready, hasItems, sheet, programme.slug])

  async function submit(formData: FormData) {
    setError("")
    setPending(true)
    const result = await placeOrder({
      slug: programme.slug,
      cart: payload,
      attendee: {
        fullName: String(formData.get("fullName") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        email: String(formData.get("email") ?? ""),
        numberOfPeople: Number(formData.get("numberOfPeople") ?? 1),
        deliveryPointId: String(formData.get("deliveryPointId") ?? ""),
        dietaryNotes: String(formData.get("dietaryNotes") ?? ""),
        isGroupOrder: formData.get("isGroupOrder") === "on",
        groupName: String(formData.get("groupName") ?? ""),
        acceptedTerms: true,
      },
    })
    setPending(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    clearProgramme(programme.id)
    router.replace(`/p/${programme.slug}/checkout?pay=${result.reference}&token=${result.accessToken}`)
    router.refresh()
  }

  return (
    <div className="bg-white pb-24 text-ink">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="rise">
          <p className="text-sm font-semibold tracking-wide text-palm uppercase">Checkout</p>
          <h1 className="mt-2 font-heading text-4xl">{programme.title}</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            The kitchen holds your seats for 30 minutes while you pay. Orders close {programme.cutoffHours} hours before each slot.
          </p>
          {sheet ? <PaymentSheet sheet={sheet} paying={paying} setPaying={setPaying} /> : null}
          {!sheet && ready && !hasItems ? (
            <div className="mt-8 rounded-2xl bg-[#f7f6f3] p-6">
              <p className="font-heading text-2xl">Your list is empty</p>
              <Link href={`/p/${programme.slug}`} className="mt-4 inline-flex h-12 items-center rounded-lg bg-palm px-5 text-sm font-semibold text-cream">
                Back to the menu
              </Link>
            </div>
          ) : null}
          {!sheet && hasItems ? (
            <form
              className="mt-8 space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                const data = new FormData(event.currentTarget)
                if (data.get("acceptedTerms") !== "on") {
                  setError("Tick the cutoff and refund terms before you pay.")
                  return
                }
                void submit(data)
              }}
            >
              <Field label="Full name" name="fullName" autoComplete="name" required />
              <Field label="Phone" name="phone" autoComplete="tel" required placeholder="0803 000 0000" />
              <Field label="Email" name="email" type="email" autoComplete="email" required />
              <label className="block text-sm font-medium">
                People this order feeds
                <input
                  name="numberOfPeople"
                  type="number"
                  min={1}
                  max={50}
                  defaultValue={1}
                  required
                  className="mt-1 h-12 w-full rounded-lg border border-border bg-white px-3"
                />
              </label>
              <label className="block text-sm font-medium">
                Delivery point
                <select name="deliveryPointId" required className="mt-1 h-12 w-full rounded-lg border border-border bg-white px-3" defaultValue="">
                  <option value="" disabled>
                    Where should we drop the packs?
                  </option>
                  {programme.deliveryPoints.map((point) => (
                    <option key={point.id} value={point.id}>
                      {point.name}
                      {point.description ? ` — ${point.description}` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium">
                Notes for the kitchen
                <textarea name="dietaryNotes" rows={3} className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2" placeholder="No pepper, extra plantain, a child's portion…" />
              </label>
              <label className="flex min-h-11 items-center gap-3 text-sm font-medium">
                <input name="isGroupOrder" type="checkbox" className="size-5 accent-palm" />
                I&apos;m ordering for a group or family
              </label>
              <Field label="Group or family name" name="groupName" placeholder="Only if this is a group order" />
              <label className="flex items-start gap-3 text-sm leading-6">
                <input name="acceptedTerms" type="checkbox" className="mt-1 size-5 accent-palm" />
                <span>
                  I understand orders close {programme.cutoffHours} hours before each slot. A cancelled slot becomes a refund request for the church team. Nothing is refunded automatically.
                </span>
              </label>
              {error ? <p className="text-sm text-tomato" role="alert">{error}</p> : null}
              <button type="submit" disabled={pending || !ready} className="inline-flex h-12 items-center rounded-lg bg-palm px-5 text-sm font-semibold text-cream disabled:opacity-40">
                {pending ? "Reserving seats…" : "Pay"}
              </button>
            </form>
          ) : null}
          {!ready ? <p className="mt-8 text-sm text-muted-foreground">Loading your list…</p> : null}
        </div>
        <aside className="h-fit rounded-2xl bg-[#f7f6f3] p-5 text-sm">
          <p className="font-heading text-2xl">Before you pay</p>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li>Prices are read from the menu again at this step.</li>
            <li>A pending payment holds the seat for 30 minutes.</li>
            <li>You collect at the delivery point, not at the gate.</li>
          </ul>
          <Link href={`/p/${programme.slug}/review`} className="mt-4 inline-flex h-11 items-center font-semibold text-palm">
            Edit the list
          </Link>
        </aside>
      </div>
    </div>
  )
}

function Field({
  label,
  name,
  type = "text",
  ...props
}: {
  label: string
  name: string
  type?: string
  autoComplete?: string
  required?: boolean
  placeholder?: string
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input name={name} type={type} {...props} className="mt-1 h-12 w-full rounded-lg border border-border bg-white px-3" />
    </label>
  )
}

function PaymentSheet({
  sheet,
  paying,
  setPaying,
}: {
  sheet: Sheet
  paying: boolean
  setPaying: (value: boolean) => void
}) {
  const router = useRouter()
  const [error, setError] = useState("")

  async function payMock() {
    setPaying(true)
    setError("")
    const result = await confirmMockPayment(sheet.reference, tokenFromLocation())
    setPaying(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    router.push(result.href)
  }

  async function payLive() {
    setPaying(true)
    setError("")
    try {
      if (!sheet.publicKey) throw new Error("The Paystack public key is missing.")
      await loadPaystack()
      const token = tokenFromLocation()
      const popup = window.PaystackPop?.setup({
        key: sheet.publicKey,
        email: sheet.email,
        amount: sheet.totalKobo,
        ref: sheet.reference,
        callback: () => {
          void verifyPayment(sheet.reference, token).then((result) => {
            setPaying(false)
            if (!result.ok) {
              setError(result.error)
              return
            }
            router.push(result.href)
          })
        },
        onClose: () => setPaying(false),
      })
      popup?.openIframe()
    } catch (cause) {
      setPaying(false)
      setError(cause instanceof Error ? cause.message : "Paystack didn't open.")
    }
  }

  return (
    <section className="mt-8 rounded-2xl bg-white p-5 ring-1 ring-foreground/10">
      <p className="text-sm font-semibold tracking-wide text-palm uppercase">
        {sheet.mode === "mock" ? "Mock payment" : "Paystack"}
      </p>
      <h2 className="mt-2 font-heading text-3xl">{formatNaira(sheet.totalKobo)}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Reference {sheet.reference}. {sheet.mode === "mock" ? "No card is charged on this preview." : "Paystack opens next. The webhook confirms the payment."}
      </p>
      {error ? <p className="mt-3 text-sm text-tomato">{error}</p> : null}
      <button
        type="button"
        disabled={paying}
        onClick={() => void (sheet.mode === "mock" ? payMock() : payLive())}
        className="mt-4 inline-flex h-12 items-center rounded-lg bg-gold px-5 text-sm font-semibold text-ink disabled:opacity-40"
      >
        {paying ? "Checking payment…" : sheet.mode === "mock" ? "Mark as paid" : "Pay with Paystack"}
      </button>
    </section>
  )
}

function tokenFromLocation() {
  return new URLSearchParams(window.location.search).get("token") ?? ""
}

function loadPaystack() {
  return new Promise<void>((resolve, reject) => {
    if (window.PaystackPop) {
      resolve()
      return
    }
    const script = document.createElement("script")
    script.src = "https://js.paystack.co/v1/inline.js"
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Paystack didn't load."))
    document.body.appendChild(script)
  })
}

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: {
        key: string
        email: string
        amount: number
        ref: string
        callback: (response: { reference: string }) => void
        onClose: () => void
      }) => { openIframe: () => void }
    }
  }
}
