import assert from "node:assert/strict"
import { test } from "node:test"
import { formatNaira, koboToNaira, nairaToKobo, parseNairaToKobo } from "./money"

test("kobo converts to a naira number and back without losing kobo", () => {
  assert.equal(koboToNaira(700_000), 7000)
  assert.equal(typeof koboToNaira(700_000), "number")
  assert.equal(koboToNaira(0), 0)
  assert.equal(koboToNaira(1), 0.01)
  assert.equal(koboToNaira(99), 0.99)
  assert.equal(koboToNaira(150_050), 1500.5)
  assert.equal(nairaToKobo(20.28), 2028)
  assert.equal(nairaToKobo(20.99), 2099)
  assert.equal(nairaToKobo(koboToNaira(2099)), 2099)
  assert.equal(nairaToKobo(koboToNaira(150_050)), 150_050)
  assert.equal(nairaToKobo(koboToNaira(700_000)), 700_000)
  assert.throws(() => koboToNaira(1.5))
  assert.throws(() => koboToNaira(-1))
  assert.throws(() => nairaToKobo(Number.NaN))
})

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
