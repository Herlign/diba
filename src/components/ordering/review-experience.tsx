"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Minus, Plus } from "lucide-react"
import { useCart, useCartHydrated } from "@/lib/cart/store"
import { formatNaira } from "@/lib/money"
import { quoteProgrammeCart, type CartQuote } from "@/lib/ordering/quote"

export function ReviewExperience({ programmeId, slug, title }: { programmeId: string; slug: string; title: string }) {
  const ready = useCartHydrated()
  const cart = useCart((state) => state.carts[programmeId])
  const setQuantity = useCart((state) => state.setQuantity)
  const removeSlot = useCart((state) => state.removeSlot)
  const [quote, setQuote] = useState<CartQuote | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!ready) return
    const payload = {
      planId: cart?.planId ?? null,
      slots: Object.entries(cart?.items ?? {}).map(([mealSlotId, items]) => ({ mealSlotId, items })),
    }
    let cancelled = false
    quoteProgrammeCart(slug, payload)
      .then((next) => {
        if (!cancelled) {
          setQuote(next)
          setFailed(next === null)
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [ready, cart, slug])

  if (!ready) {
    return <p className="px-4 py-16 text-sm text-muted-foreground">Loading your list…</p>
  }

  const hasItems = Object.values(cart?.items ?? {}).some((lines) => lines.length > 0)
  if (!hasItems) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="font-heading text-4xl">Your list is empty</h1>
        <p className="mt-3 text-sm text-muted-foreground">Pick a few slots and add plates first.</p>
        <Link href={`/p/${slug}`} className="mt-6 inline-flex h-12 items-center rounded-lg bg-palm px-5 text-sm font-semibold text-cream">
          Back to {title}
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white pb-16 text-ink">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <p className="text-sm font-semibold tracking-wide text-palm uppercase">Review</p>
        <h1 className="mt-2 font-heading text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Prices here are read from the menu again. What you see is what checkout will charge.</p>
        {failed ? <p className="mt-4 text-sm text-tomato">We couldn&apos;t price this list. Go back and try the slots again.</p> : null}
        {quote?.earliestCutoffLabel ? (
          <p className="mt-4 rounded-xl bg-[#eef6f1] px-4 py-3 text-sm text-palm">
            Order before {quote.earliestCutoffLabel} for your first meal.
          </p>
        ) : null}
        {quote?.planMessage ? <p className="mt-3 text-sm">{quote.planMessage}</p> : null}
        {quote?.dropped.map((note) => (
          <p key={note} className="mt-2 text-sm text-tomato">
            {note}
          </p>
        ))}
        <div className="mt-6 space-y-6">
          {quote?.groups.map((group) => (
            <section key={group.dateKey}>
              <h2 className="font-heading text-2xl">{group.label}</h2>
              {group.periods.map((period) => (
                <div key={period.mealSlotId} className="mt-3 rounded-2xl bg-white p-4 ring-1 ring-foreground/10">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{period.periodName}</p>
                      <p className="text-sm text-muted-foreground">{period.windowLabel}</p>
                    </div>
                    <button type="button" className="h-11 text-sm font-semibold text-tomato" onClick={() => removeSlot(programmeId, period.mealSlotId)}>
                      Remove
                    </button>
                  </div>
                  <ul className="mt-3 space-y-3">
                    {period.lines.map((line) => (
                      <li key={line.variantId} className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{line.itemName}</p>
                          <p className="text-sm text-muted-foreground">
                            {line.variantLabel} · {formatNaira(line.lineTotalKobo)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button type="button" aria-label={`Fewer ${line.itemName} ${line.variantLabel}`} className="inline-flex size-11 items-center justify-center rounded-lg border border-border" onClick={() => setQuantity(programmeId, period.mealSlotId, line.variantId, line.quantity - 1)}>
                            <Minus className="size-4" />
                          </button>
                          <span className="w-6 text-center text-sm">{line.quantity}</span>
                          <button type="button" aria-label={`More ${line.itemName} ${line.variantLabel}`} className="inline-flex size-11 items-center justify-center rounded-lg border border-border" onClick={() => setQuantity(programmeId, period.mealSlotId, line.variantId, Math.min(20, line.quantity + 1))}>
                            <Plus className="size-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          ))}
        </div>
        {quote ? (
          <dl className="mt-6 space-y-2 rounded-2xl bg-[#f7f6f3] p-4 text-sm">
            <div className="flex justify-between"><dt>{quote.planApplied && quote.discountKobo === 0 ? "Plan price" : "Menu"}</dt><dd>{formatNaira(quote.subtotalKobo)}</dd></div>
            <div className="flex justify-between"><dt>Plan discount</dt><dd>{formatNaira(quote.discountKobo)}</dd></div>
            <div className="flex justify-between"><dt>Delivery</dt><dd>{formatNaira(quote.deliveryFeeKobo)}</dd></div>
            <div className="flex justify-between"><dt>Service</dt><dd>{formatNaira(quote.serviceFeeKobo)}</dd></div>
            <div className="flex justify-between border-t border-border pt-2 font-heading text-2xl"><dt>Total</dt><dd>{formatNaira(quote.totalKobo)}</dd></div>
          </dl>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">Pricing this list…</p>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          {quote ? (
            <Link href={`/p/${slug}/checkout`} className="inline-flex h-12 items-center rounded-lg bg-palm px-5 text-sm font-semibold text-cream">
              Continue to checkout
            </Link>
          ) : null}
          <Link href={`/p/${slug}`} className="inline-flex h-12 items-center text-sm font-semibold text-palm">
            Edit slots and plates
          </Link>
        </div>
      </div>
    </div>
  )
}
