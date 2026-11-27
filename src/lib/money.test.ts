import assert from "node:assert/strict"
import { test } from "node:test"
import { formatNaira, parseNairaToKobo } from "./money"

test("formatNaira prints whole naira with the naira sign", () => {
  assert.equal(formatNaira(350000), "₦3,500")
  assert.equal(formatNaira(50000), "₦500")
  assert.equal(formatNaira(0), "₦0")
})

test("parseNairaToKobo accepts grouped naira and rejects a blank field", () => {
  assert.equal(parseNairaToKobo("1500"), 150000)
  assert.equal(parseNairaToKobo("1,500"), 150000)
  assert.equal(parseNairaToKobo("₦1,500"), 150000)
  assert.equal(parseNairaToKobo("₦ 1,500"), 150000)
  assert.equal(parseNairaToKobo("1 500"), 150000)
  assert.equal(parseNairaToKobo("1500.50"), 150050)
  assert.equal(parseNairaToKobo("1,500.5"), 150050)
  assert.equal(parseNairaToKobo("0"), 0)
  assert.equal(parseNairaToKobo(""), null)
  assert.equal(parseNairaToKobo("   "), null)
  assert.equal(parseNairaToKobo("1,500 naira"), 150000)
  assert.equal(parseNairaToKobo("abc"), null)
  assert.equal(parseNairaToKobo("-5"), null)
  assert.equal(parseNairaToKobo("1.500"), null)
  assert.equal(parseNairaToKobo("1000001"), null)
})
