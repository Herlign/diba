import { holdsCapacity, slotAvailability, type SlotState } from "@/lib/ordering/rules"

export function activeHoldCount(orders: { status: string; createdAt: Date }[], now: Date) {
  return orders.filter((order) => holdsCapacity(order.status, order.createdAt, now)).length
}

export function checkoutSlotState(input: {
  programmeStatus: string
  isOpen: boolean
  hasMenu: boolean
  now: Date
  deliveryStart: Date
  cutoffHours: number
  capacity: number | null
  orders: { status: string; createdAt: Date }[]
}): SlotState {
  return slotAvailability({
    programmeStatus: input.programmeStatus,
    isOpen: input.isOpen,
    hasMenu: input.hasMenu,
    now: input.now,
    deliveryStart: input.deliveryStart,
    cutoffHours: input.cutoffHours,
    capacity: input.capacity,
    held: activeHoldCount(input.orders, input.now),
  })
}
