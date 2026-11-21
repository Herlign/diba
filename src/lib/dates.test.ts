import assert from "node:assert/strict"
import { test } from "node:test"
import { formatDateRange } from "./dates"

test("formatDateRange collapses a single Lagos day", () => {
  const start = new Date("2026-12-20T05:00:00.000Z")
  const end = new Date("2026-12-20T20:00:00.000Z")
  assert.equal(formatDateRange(start, end), "20 Dec 2026")
})

test("formatDateRange uses an en dash inside one month", () => {
  const start = new Date("2026-12-04T05:00:00.000Z")
  const end = new Date("2026-12-06T20:00:00.000Z")
  assert.equal(formatDateRange(start, end), "4–6 Dec 2026")
})

test("formatDateRange keeps both months across a year boundary", () => {
  const start = new Date("2026-12-31T16:00:00.000Z")
  const end = new Date("2027-01-01T08:00:00.000Z")
  assert.equal(formatDateRange(start, end), "31 Dec 2026 – 1 Jan 2027")
})
