import { describe, expect, it } from "vitest"
import { prepSheet } from "@/lib/kitchen/prep"

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
