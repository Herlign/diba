import assert from "node:assert/strict"
import { test } from "node:test"
import { formatNaira } from "./money"

test("formatNaira prints whole naira with the naira sign", () => {
  assert.equal(formatNaira(350000), "₦3,500")
  assert.equal(formatNaira(50000), "₦500")
  assert.equal(formatNaira(0), "₦0")
})
