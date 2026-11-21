import { describe, expect, it } from "vitest"
import { can } from "@/lib/auth/access"

describe("staff role access", () => {
  it("lets the admin open every ops section", () => {
    for (const section of ["overview", "catalogue", "orders", "kitchen", "dispatch"] as const) {
      expect(can("SUPER_ADMIN", section)).toBe(true)
      expect(can("CHURCH_ADMIN", section)).toBe(true)
    }
  })

  it("keeps the kitchen on the prep sheet", () => {
    expect(can("KITCHEN", "kitchen")).toBe(true)
    expect(can("KITCHEN", "overview")).toBe(true)
    expect(can("KITCHEN", "orders")).toBe(false)
    expect(can("KITCHEN", "dispatch")).toBe(false)
    expect(can("KITCHEN", "catalogue")).toBe(false)
  })

  it("keeps dispatch on the scanner and manifest", () => {
    expect(can("DISPATCH", "dispatch")).toBe(true)
    expect(can("DISPATCH", "overview")).toBe(true)
    expect(can("DISPATCH", "kitchen")).toBe(false)
    expect(can("DISPATCH", "orders")).toBe(false)
  })

  it("refuses a missing role", () => {
    expect(can(null, "overview")).toBe(false)
    expect(can("GUEST", "dispatch")).toBe(false)
  })
})
