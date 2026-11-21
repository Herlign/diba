export const UserRole = {
  ATTENDEE: "ATTENDEE",
  COORDINATOR: "COORDINATOR",
  KITCHEN: "KITCHEN",
  RIDER: "RIDER",
  ADMIN: "ADMIN",
} as const

export const ProgrammeStatus = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  ORDERING_OPEN: "ORDERING_OPEN",
  ORDERING_CLOSED: "ORDERING_CLOSED",
  LIVE: "LIVE",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const

export type ProgrammeStatusValue =
  (typeof ProgrammeStatus)[keyof typeof ProgrammeStatus]

export const PUBLIC_PROGRAMME_STATUSES: ProgrammeStatusValue[] = [
  ProgrammeStatus.PUBLISHED,
  ProgrammeStatus.ORDERING_OPEN,
  ProgrammeStatus.ORDERING_CLOSED,
  ProgrammeStatus.LIVE,
  ProgrammeStatus.COMPLETED,
  ProgrammeStatus.CANCELLED,
]

export const MealKind = {
  BREAKFAST: "BREAKFAST",
  LUNCH: "LUNCH",
  DINNER: "DINNER",
} as const

export const MenuCategory = {
  PLATE: "PLATE",
  SIDE: "SIDE",
  DRINK: "DRINK",
} as const

export const OrderStatus = {
  CART: "CART",
  PENDING_PAYMENT: "PENDING_PAYMENT",
  PAID: "PAID",
  CONFIRMED: "CONFIRMED",
  PREPARING: "PREPARING",
  READY: "READY",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
} as const

export const Fulfilment = {
  SECTION_DROP: "SECTION_DROP",
  VENUE_PICKUP: "VENUE_PICKUP",
  OFFSITE: "OFFSITE",
} as const

export const PaymentStatus = {
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const

export const DeliveryStatus = {
  UNASSIGNED: "UNASSIGNED",
  ASSIGNED: "ASSIGNED",
  PICKED_UP: "PICKED_UP",
  DELIVERED: "DELIVERED",
  FAILED: "FAILED",
} as const

export const BatchStatus = {
  PLANNED: "PLANNED",
  PREPPING: "PREPPING",
  PACKED: "PACKED",
  HANDED_OFF: "HANDED_OFF",
} as const

export const STATUS_LABEL: Record<string, string> = {
  [ProgrammeStatus.DRAFT]: "Draft",
  [ProgrammeStatus.PUBLISHED]: "Announced",
  [ProgrammeStatus.ORDERING_OPEN]: "Ordering open",
  [ProgrammeStatus.ORDERING_CLOSED]: "Ordering closed",
  [ProgrammeStatus.LIVE]: "In session",
  [ProgrammeStatus.COMPLETED]: "Completed",
  [ProgrammeStatus.CANCELLED]: "Cancelled",
}

export const MEAL_LABEL: Record<string, string> = {
  [MealKind.BREAKFAST]: "Breakfast",
  [MealKind.LUNCH]: "Lunch",
  [MealKind.DINNER]: "Dinner",
}

export const LIST_STATUS_FILTERS = [
  { value: "all", label: "All programmes" },
  { value: "open", label: "Ordering open" },
  { value: "upcoming", label: "Still ahead" },
  { value: "past", label: "Already held" },
] as const

export type ListStatusFilter = (typeof LIST_STATUS_FILTERS)[number]["value"]

export function parseListStatus(value: string | undefined): ListStatusFilter {
  if (value === "open" || value === "upcoming" || value === "past") return value
  return "all"
}
