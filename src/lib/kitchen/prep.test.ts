import { describe, expect, it } from "vitest"
import { prepSheet } from "@/lib/kitchen/prep"
import { orderLineLabel } from "@/lib/ordering/line-label"

describe("prep counts", () => {
  it("adds quantities of the same plate and keeps variants apart", () => {
    const sheet = prepSheet([
      {
        slotStatus: "SCHEDULED",
        attendee: "Ada",
        notes: "Not too much pepper.",
        items: [{ name: "Akara & Pap · Regular", quantity: 1 }],
      },
      {
        slotStatus: "SCHEDULED",
        attendee: "Tunde",
        notes: "",
        items: [
          { name: "Akara & Pap · Regular", quantity: 2 },
          { name: "Akara & Pap · Family Pack", quantity: 1 },
        ],
      },
    ])
    expect(sheet.meals).toBe(2)
    expect(sheet.lines).toEqual([
      { name: "Akara & Pap · Regular", quantity: 3 },
      { name: "Akara & Pap · Family Pack", quantity: 1 },
    ])
    expect(sheet.notes).toEqual([{ attendee: "Ada", notes: "Not too much pepper." }])
  })

  it("counts the same plate separately for each size", () => {
    const sheet = prepSheet([
      {
        slotStatus: "SCHEDULED",
        attendee: "Ada",
        notes: "",
        items: [
          { name: orderLineLabel({ nameSnapshot: "Hake fish · Regular", variantLabelSnapshot: "Regular" }), quantity: 2 },
          { name: orderLineLabel({ nameSnapshot: "Hake fish · Large", variantLabelSnapshot: "Large" }), quantity: 1 },
        ],
      },
    ])
    expect(sheet.lines).toEqual([
      { name: "Hake fish · Regular", quantity: 2 },
      { name: "Hake fish · Large", quantity: 1 },
    ])
  })

  it("leaves cancelled meals off the sheet", () => {
    const sheet = prepSheet([
      {
        slotStatus: "CANCELLED",
        attendee: "Ada",
        notes: "Skip this",
        items: [{ name: "Jollof Rice + Chicken · Regular", quantity: 4 }],
      },
    ])
    expect(sheet.meals).toBe(0)
    expect(sheet.lines).toEqual([])
    expect(sheet.notes).toEqual([])
  })
})
