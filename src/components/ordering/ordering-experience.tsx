"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { MapPin, Minus, Plus } from "lucide-react"
import { FoodImage } from "@/components/food-image"
import { useCart } from "@/lib/cart/store"
import { formatNaira } from "@/lib/money"
import { formatWindow } from "@/lib/dates"
import { quoteTotals, selectionSatisfiesPlan, type PricedSlot } from "@/lib/ordering/rules"
import type { OrderingItem, OrderingProgramme, OrderingSlot, OrderingVariant } from "@/lib/ordering/types"
import type { FoodPhoto } from "@/lib/food-photos"
import { track } from "@/lib/analytics"

function photoFor(item: OrderingItem): FoodPhoto {
  return { src: item.imageUrl, alt: item.name, label: item.name, credit: "", href: "" }
}

export function OrderingExperience({ programme }: { programme: OrderingProgramme }) {
  const cart = useCart((state) => state.carts[programme.id])
  const toggleSlot = useCart((state) => state.toggleSlot)
  const applyPlan = useCart((state) => state.applyPlan)
  const clearPlan = useCart((state) => state.clearPlan)
  const addToSlots = useCart((state) => state.addToSlots)
  const selected = cart?.selectedSlotIds ?? EMPTY_IDS
  const items = cart?.items ?? EMPTY_ITEMS
  const planId = cart?.planId ?? null
  const [periodId, setPeriodId] = useState(programme.periods[0]?.id ?? "")
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [variantChoice, setVariantChoice] = useState<Record<string, string>>({})
  const [draft, setDraft] = useState<{ item: OrderingItem; variant: OrderingVariant; quantity: number; slotIds: string[] } | null>(null)
  const days = programme.dateKeys
  useEffect(() => {
    track("view_programme", { slug: programme.slug, title: programme.title })
  }, [programme.slug, programme.title])

  function chooseSlot(slot: OrderingSlot) {
    if (slot.state !== "open") return
    toggleSlot(programme.id, slot.id)
    setPeriodId(slot.periodId)
  }

  function apply(planIdToApply: string) {
    const plan = programme.plans.find((item) => item.id === planIdToApply)
    if (!plan) return
    if (planId === plan.id) {
      clearPlan(programme.id)
      return
    }
    const slotIds = programme.slots
      .filter((slot) => slot.state === "open" && plan.periodIds.includes(slot.periodId))
      .filter((slot) => plan.coversAllDays || selected.includes(slot.id))
      .map((slot) => slot.id)
    applyPlan(programme.id, plan.id, plan.coversAllDays ? slotIds : slotIds)
  }

  const priced = useMemo(() => buildPriced(programme, items), [programme, items])
  const plan = programme.plans.find((item) => item.id === planId) ?? null
  const satisfied = plan
    ? selectionSatisfiesPlan(
        {
          coversAllDays: plan.coversAllDays,
          periodIds: plan.periodIds,
          pricingMode: plan.pricingMode,
          fixedPricePerSlotKobo: plan.fixedPricePerSlotKobo,
          discountPercent: plan.discountPercent,
        },
        programme.dateKeys,
        priced,
      )
    : { ok: false, message: "" }
  const totals = quoteTotals(
    priced,
    plan
      ? {
          coversAllDays: plan.coversAllDays,
          periodIds: plan.periodIds,
          pricingMode: plan.pricingMode,
          fixedPricePerSlotKobo: plan.fixedPricePerSlotKobo,
          discountPercent: plan.discountPercent,
        }
      : null,
    satisfied.ok,
  )
  const mealCount = priced.filter((slot) => slot.lines.some((line) => line.quantity > 0)).length
  const visibleMenu = programme.menu
    .map((item) => ({
      ...item,
      variants: item.variants.filter((variant) => variant.periodIds.includes(periodId)),
    }))
    .filter((item) => item.variants.length > 0)
  const categories = [...new Set(visibleMenu.map((item) => item.categoryName))]

  function openAdd(item: OrderingItem) {
    const variantId = variantChoice[item.id] ?? item.variants.find((variant) => variant.periodIds.includes(periodId))?.id
    const variant = item.variants.find((entry) => entry.id === variantId)
    if (!variant) return
    const targets = programme.slots.filter(
      (slot) => selected.includes(slot.id) && slot.state === "open" && variant.periodIds.includes(slot.periodId),
    )
    if (targets.length === 0) return
    setDraft({
      item,
      variant,
      quantity: quantities[item.id] ?? 1,
      slotIds: targets.map((slot) => slot.id),
    })
  }

  const directions =
    programme.lat !== null && programme.lng !== null
      ? `https://www.google.com/maps/dir/?api=1&destination=${programme.lat},${programme.lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(programme.venueAddress)}`

  return (
    <div className="bg-white pb-28 text-ink">
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-muted">
            {programme.coverImageUrl ? (
              <FoodImage
                photo={{ src: programme.coverImageUrl, alt: programme.title, label: programme.title, credit: "", href: "" }}
                priority
              />
            ) : null}
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide text-palm uppercase">{programme.churchName}</p>
            <h1 className="mt-2 font-heading text-4xl leading-tight sm:text-5xl">{programme.title}</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{programme.description}</p>
            <p className="mt-4 text-sm font-medium">
              {programme.slots[0]?.label} – {programme.slots.at(-1)?.label}
            </p>
            <p className="mt-2 flex items-start gap-2 text-sm">
              <MapPin className="mt-0.5 size-4 shrink-0 text-palm" aria-hidden="true" />
              <span>
                {programme.venueName}
                {programme.venueNotes ? ` · ${programme.venueNotes}` : ""}
              </span>
            </p>
            <a href={directions} className="mt-3 inline-flex h-11 items-center text-sm font-semibold text-palm">
              Get directions
            </a>
            <ul className="mt-3 flex flex-wrap gap-2">
              {programme.periods.map((period) => (
                <li key={period.id} className="rounded-full bg-[#eef6f1] px-3 py-1 text-sm text-palm">
                  {period.name}: {formatWindow(period.start, period.end)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {programme.plans.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <h2 className="font-heading text-3xl">Meal plans</h2>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
            {programme.plans.map((plan) => {
              const active = planId === plan.id
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => apply(plan.id)}
                  className={`min-w-[16rem] rounded-2xl border p-4 text-left ${active ? "border-palm bg-[#eef6f1]" : "border-border bg-white"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-heading text-xl">{plan.name}</p>
                    {plan.isPopular ? <span className="rounded-full bg-gold px-2 py-1 text-xs font-semibold">Most popular</span> : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{plan.description}</p>
                  <p className="mt-3 text-sm font-semibold text-palm">
                    From {formatNaira(plan.perDayKobo)} a day
                    {plan.totalKobo !== null ? ` · ${formatNaira(plan.totalKobo)} all in` : ""}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{active ? "Selected" : "Use this plan"}</p>
                </button>
              )
            })}
          </div>
          {plan && !satisfied.ok ? <p className="mt-3 text-sm text-muted-foreground">{satisfied.message}</p> : null}
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="font-heading text-3xl">Pick your slots</h2>
        <p className="mt-2 text-sm text-muted-foreground">Each cell is one meal. Closed, sold out, and unserved slots stay labelled.</p>
        <div className="mt-4 space-y-2 overflow-x-auto">
          <div
            className="grid min-w-[20rem] gap-2"
            style={{ gridTemplateColumns: `7rem repeat(${programme.periods.length}, minmax(8rem, 1fr))` }}
          >
            <div />
            {programme.periods.map((period) => (
              <div key={period.id} className="px-2 text-sm font-semibold">
                {period.name}
              </div>
            ))}
          </div>
          {days.map((dateKey) => {
            const daySlots = programme.slots.filter((slot) => slot.dateKey === dateKey)
            return (
              <div
                key={dateKey}
                className="grid min-w-[20rem] gap-2"
                style={{ gridTemplateColumns: `7rem repeat(${programme.periods.length}, minmax(8rem, 1fr))` }}
              >
                <div className="flex items-center text-sm font-medium">{daySlots[0]?.label}</div>
                {programme.periods.map((period) => {
                    const slot = daySlots.find((item) => item.periodId === period.id)
                    if (!slot) {
                      return (
                        <div key={period.id} className="rounded-xl bg-muted px-3 py-3 text-sm text-muted-foreground">
                          Not served
                        </div>
                      )
                    }
                    const isSelected = selected.includes(slot.id)
                    const disabled = slot.state !== "open"
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={disabled}
                        aria-pressed={isSelected}
                        onClick={() => chooseSlot(slot)}
                        className={`min-h-11 rounded-xl px-3 py-3 text-left text-sm ${
                          disabled
                            ? "bg-muted text-muted-foreground"
                            : isSelected
                              ? "border border-palm bg-[#eef6f1] text-ink"
                              : "border border-border bg-white"
                        }`}
                      >
                        <span className="block font-semibold">{slot.reason}</span>
                        <span className="mt-1 block text-xs">{formatWindow(slot.windowStart, slot.windowEnd)}</span>
                      </button>
                    )
                  })}
              </div>
            )
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap gap-2">
          {programme.periods.map((period) => (
            <button
              key={period.id}
              type="button"
              onClick={() => setPeriodId(period.id)}
              className={`h-11 rounded-full px-4 text-sm font-semibold ${periodId === period.id ? "bg-palm text-cream" : "bg-[#eef6f1] text-palm"}`}
            >
              {period.name} menu
            </button>
          ))}
        </div>
        {categories.map((category) => (
          <div key={category} className="mt-6">
            <h2 className="font-heading text-2xl">{category}</h2>
            {category === "Extras" ? (
              <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
                Add-ons for any slot. Add one alongside a plate, or on its own.
              </p>
            ) : null}
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {visibleMenu
                .filter((item) => item.categoryName === category)
                .map((item) => {
                  const offered = item.variants.filter((variant) => variant.periodIds.includes(periodId))
                  const chosen = offered.find((variant) => variant.id === variantChoice[item.id]) ?? offered[0]
                  if (!chosen) return null
                  const quantity = quantities[item.id] ?? 1
                  const allHours =
                    category !== "Extras" &&
                    programme.periods.length > 0 &&
                    programme.periods.every((period) => chosen.periodIds.includes(period.id))
                  const targets = programme.slots.filter(
                    (slot) => selected.includes(slot.id) && slot.state === "open" && chosen.periodIds.includes(slot.periodId),
                  )
                  return (
                    <article key={item.id} className="overflow-hidden rounded-2xl bg-white ring-1 ring-foreground/10">
                      <div className="relative aspect-[4/3] bg-muted">
                        <FoodImage photo={photoFor(item)} />
                      </div>
                      <div className="space-y-3 p-4">
                        <h3 className="font-heading text-2xl">{item.name}</h3>
                        {allHours ? (
                          <p className="text-xs font-semibold tracking-wide text-palm uppercase">All hours</p>
                        ) : null}
                        <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
                        {item.dietaryTags.length > 0 ? (
                          <ul className="flex flex-wrap gap-2">
                            {item.dietaryTags.map((tag) => (
                              <li key={tag} className="rounded-full bg-[#eef6f1] px-2 py-1 text-xs font-semibold text-palm">
                                {tag}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                        <label className="block text-sm font-medium">
                          Size
                          <select
                            value={chosen.id}
                            onChange={(event) => setVariantChoice((current) => ({ ...current, [item.id]: event.target.value }))}
                            className="mt-1 h-11 w-full rounded-lg border border-border bg-white px-3"
                          >
                            {offered.map((variant) => (
                              <option key={variant.id} value={variant.id}>
                                {variant.name} · {formatNaira(variant.priceKobo)}
                                {variant.servesCount > 1 ? ` · feeds ${variant.servesCount}` : ""}
                              </option>
                            ))}
                          </select>
                        </label>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <button type="button" aria-label={`Fewer ${item.name}`} className="inline-flex size-11 items-center justify-center rounded-lg border border-border" onClick={() => setQuantities((current) => ({ ...current, [item.id]: Math.max(1, quantity - 1) }))}>
                              <Minus className="size-4" />
                            </button>
                            <span className="w-6 text-center text-sm font-semibold">{quantity}</span>
                            <button type="button" aria-label={`More ${item.name}`} className="inline-flex size-11 items-center justify-center rounded-lg border border-border" onClick={() => setQuantities((current) => ({ ...current, [item.id]: Math.min(20, quantity + 1) }))}>
                              <Plus className="size-4" />
                            </button>
                          </div>
                          <button
                            type="button"
                            disabled={targets.length === 0}
                            onClick={() => openAdd(item)}
                            className="inline-flex h-11 items-center rounded-lg bg-palm px-4 text-sm font-semibold text-cream disabled:opacity-40"
                          >
                            Add
                          </button>
                        </div>
                        {targets.length === 0 ? <p className="text-xs text-muted-foreground">Select an open {programme.periods.find((period) => period.id === periodId)?.name.toLowerCase()} slot first.</p> : null}
                      </div>
                    </article>
                  )
                })}
            </div>
          </div>
        ))}
      </section>

      {draft ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="add-title" className="w-full max-w-md rounded-2xl bg-white p-5 text-ink">
            <h2 id="add-title" className="font-heading text-2xl">Add to which slots?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {draft.quantity} × {draft.item.name} · {draft.variant.name}
            </p>
            <ul className="mt-4 space-y-2">
              {programme.slots
                .filter((slot) => selected.includes(slot.id) && slot.state === "open" && draft.variant.periodIds.includes(slot.periodId))
                .map((slot) => (
                  <li key={slot.id}>
                    <label className="flex min-h-11 items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={draft.slotIds.includes(slot.id)}
                        onChange={(event) =>
                          setDraft((current) =>
                            current
                              ? {
                                  ...current,
                                  slotIds: event.target.checked
                                    ? [...current.slotIds, slot.id]
                                    : current.slotIds.filter((id) => id !== slot.id),
                                }
                              : current,
                          )
                        }
                      />
                      {slot.label} · {slot.periodName}
                    </label>
                  </li>
                ))}
            </ul>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" className="h-11 px-3 text-sm font-semibold" onClick={() => setDraft(null)}>
                Cancel
              </button>
              <button
                type="button"
                disabled={draft.slotIds.length === 0}
                className="h-11 rounded-lg bg-gold px-4 text-sm font-semibold text-ink disabled:opacity-40"
                onClick={() => {
                  addToSlots(programme.id, draft.slotIds, draft.variant.id, draft.quantity)
                  track("add_to_cart", {
                    slug: programme.slug,
                    item: draft.item.name,
                    variant: draft.variant.name,
                    quantity: draft.quantity,
                    slots: draft.slotIds.length,
                  })
                  setDraft(null)
                }}
              >
                Add meals
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {mealCount > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white px-4 py-3">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <p className="text-sm">
              <span className="font-semibold">{mealCount} meals</span>
              <span className="mx-2 text-muted-foreground">·</span>
              <span className="font-heading text-xl">{formatNaira(totals.totalKobo)}</span>
            </p>
            <Link href={`/p/${programme.slug}/review`} className="inline-flex h-12 items-center rounded-lg bg-palm px-5 text-sm font-semibold text-cream">
              Review
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  )
}

const EMPTY_IDS: string[] = []
const EMPTY_ITEMS: Record<string, { variantId: string; quantity: number }[]> = {}

function buildPriced(programme: OrderingProgramme, items: Record<string, { variantId: string; quantity: number }[]>): PricedSlot[] {
  const priceByVariant = new Map<string, { priceKobo: number; periodId: string }[]>()
  for (const item of programme.menu) {
    for (const variant of item.variants) {
      priceByVariant.set(
        variant.id,
        variant.periodIds.map((periodId) => ({ priceKobo: variant.priceKobo, periodId })),
      )
    }
  }
  return programme.slots
    .filter((slot) => items[slot.id]?.length)
    .map((slot) => ({
      dateKey: slot.dateKey,
      periodId: slot.periodId,
      lines: (items[slot.id] ?? []).flatMap((line) => {
        const match = priceByVariant.get(line.variantId)?.find((entry) => entry.periodId === slot.periodId)
        if (!match) return []
        return [{ quantity: line.quantity, unitPriceKobo: match.priceKobo }]
      }),
    }))
}
