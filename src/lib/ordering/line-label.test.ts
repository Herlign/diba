import { describe, expect, it } from "vitest"
import { orderLineLabel } from "@/lib/ordering/line-label"

describe("order line labels", () => {
  it("keeps older orders that only stored the combined name", () => {
    expect(orderLineLabel({ nameSnapshot: "Hake fish · Regular", variantLabelSnapshot: null })).toBe(
      "Hake fish · Regular",
    )
  })

  it("appends a portion label when the snapshot is only the plate name", () => {
    expect(orderLineLabel({ nameSnapshot: "Hake fish", variantLabelSnapshot: "Large" })).toBe("Hake fish · Large")
  })

  it("does not repeat a label already stored on the line", () => {
    expect(orderLineLabel({ nameSnapshot: "Hake fish · Large", variantLabelSnapshot: "Large" })).toBe(
      "Hake fish · Large",
    )
  })
})
