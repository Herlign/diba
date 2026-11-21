"use client"

import { useSyncExternalStore } from "react"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { CartLine } from "@/lib/ordering/types"

type ProgrammeCart = {
  planId: string | null
  selectedSlotIds: string[]
  items: Record<string, CartLine[]>
}

type CartStore = {
  carts: Record<string, ProgrammeCart>
  cartFor: (programmeId: string) => ProgrammeCart
  toggleSlot: (programmeId: string, slotId: string) => void
  applyPlan: (programmeId: string, planId: string, slotIds: string[]) => void
  clearPlan: (programmeId: string) => void
  addToSlots: (programmeId: string, slotIds: string[], variantId: string, quantity: number) => void
  setQuantity: (programmeId: string, slotId: string, variantId: string, quantity: number) => void
  removeSlot: (programmeId: string, slotId: string) => void
}

const empty = (): ProgrammeCart => ({ planId: null, selectedSlotIds: [], items: {} })

function ensure(carts: Record<string, ProgrammeCart>, programmeId: string) {
  return carts[programmeId] ?? empty()
}

export function useCartHydrated() {
  return useSyncExternalStore(
    (onChange) => useCart.persist.onFinishHydration(onChange),
    () => useCart.persist.hasHydrated(),
    () => false,
  )
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      carts: {},
      cartFor: (programmeId) => get().carts[programmeId] ?? empty(),
      toggleSlot: (programmeId, slotId) =>
        set((state) => {
          const cart = ensure(state.carts, programmeId)
          const selected = cart.selectedSlotIds.includes(slotId)
            ? cart.selectedSlotIds.filter((id) => id !== slotId)
            : [...cart.selectedSlotIds, slotId]
          const items = { ...cart.items }
          if (!selected.includes(slotId)) delete items[slotId]
          return { carts: { ...state.carts, [programmeId]: { ...cart, selectedSlotIds: selected, items } } }
        }),
      applyPlan: (programmeId, planId, slotIds) =>
        set((state) => {
          const cart = ensure(state.carts, programmeId)
          return {
            carts: {
              ...state.carts,
              [programmeId]: { ...cart, planId, selectedSlotIds: [...new Set([...cart.selectedSlotIds, ...slotIds])] },
            },
          }
        }),
      clearPlan: (programmeId) =>
        set((state) => {
          const cart = ensure(state.carts, programmeId)
          return { carts: { ...state.carts, [programmeId]: { ...cart, planId: null } } }
        }),
      addToSlots: (programmeId, slotIds, variantId, quantity) =>
        set((state) => {
          const cart = ensure(state.carts, programmeId)
          const items = { ...cart.items }
          for (const slotId of slotIds) {
            const lines = [...(items[slotId] ?? [])]
            const index = lines.findIndex((line) => line.variantId === variantId)
            if (index >= 0) {
              lines[index] = { variantId, quantity: Math.min(20, lines[index]!.quantity + quantity) }
            } else {
              lines.push({ variantId, quantity })
            }
            items[slotId] = lines
          }
          return {
            carts: {
              ...state.carts,
              [programmeId]: {
                ...cart,
                items,
                selectedSlotIds: [...new Set([...cart.selectedSlotIds, ...slotIds])],
              },
            },
          }
        }),
      setQuantity: (programmeId, slotId, variantId, quantity) =>
        set((state) => {
          const cart = ensure(state.carts, programmeId)
          const lines = (cart.items[slotId] ?? [])
            .map((line) => (line.variantId === variantId ? { ...line, quantity } : line))
            .filter((line) => line.quantity > 0)
          const items = { ...cart.items }
          if (lines.length === 0) delete items[slotId]
          else items[slotId] = lines
          return { carts: { ...state.carts, [programmeId]: { ...cart, items } } }
        }),
      removeSlot: (programmeId, slotId) =>
        set((state) => {
          const cart = ensure(state.carts, programmeId)
          const items = { ...cart.items }
          delete items[slotId]
          return {
            carts: {
              ...state.carts,
              [programmeId]: {
                ...cart,
                items,
                selectedSlotIds: cart.selectedSlotIds.filter((id) => id !== slotId),
              },
            },
          }
        }),
    }),
    { name: "diba-cart" },
  ),
)
