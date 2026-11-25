export type OrderingSlot = {
  id: string
  dateKey: string
  label: string
  periodId: string
  periodName: string
  windowStart: string
  windowEnd: string
  cutoffAt: string
  state: "open" | "ordering_closed" | "sold_out" | "not_served" | "programme_closed"
  reason: string
}

export type OrderingVariant = {
  id: string
  name: string
  priceKobo: number
  servesCount: number
  position: number
  periodIds: string[]
}

export type OrderingItem = {
  id: string
  name: string
  description: string
  imageUrl: string
  dietaryTags: string[]
  categoryName: string
  categoryPosition: number
  position: number
  variants: OrderingVariant[]
}

export type OrderingPlan = {
  id: string
  name: string
  description: string
  coversAllDays: boolean
  pricingMode: "FIXED_PER_SLOT" | "PERCENT_DISCOUNT"
  fixedPricePerSlotKobo: number | null
  discountPercent: number | null
  periodIds: string[]
  isPopular: boolean
  perDayKobo: number
  totalKobo: number | null
}

export type OrderingProgramme = {
  id: string
  slug: string
  code: string
  title: string
  description: string
  coverImageUrl: string | null
  churchName: string
  churchLogoUrl: string | null
  venueName: string
  venueAddress: string
  venueNotes: string | null
  lat: number | null
  lng: number | null
  status: string
  dateKeys: string[]
  periods: { id: string; name: string; start: string; end: string }[]
  slots: OrderingSlot[]
  plans: OrderingPlan[]
  menu: OrderingItem[]
}

export type CartLine = {
  variantId: string
  quantity: number
}

export type CartPayload = {
  planId: string | null
  selectedSlotIds: string[]
  slots: { mealSlotId: string; items: CartLine[] }[]
}
