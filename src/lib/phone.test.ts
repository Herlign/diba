import assert from "node:assert/strict"
import { test } from "node:test"
import { normaliseNigerianPhone } from "./phone"

test("normalises 080, +234 and 234 forms", () => {
  assert.equal(normaliseNigerianPhone("08090002210"), "+2348090002210")
  assert.equal(normaliseNigerianPhone("+234 809 000 2210"), "+2348090002210")
  assert.equal(normaliseNigerianPhone("2348090002210"), "+2348090002210")
})

test("rejects numbers that are not Nigerian mobiles", () => {
  assert.equal(normaliseNigerianPhone("12345"), null)
  assert.equal(normaliseNigerianPhone("07012"), null)
})
