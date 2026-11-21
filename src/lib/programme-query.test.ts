import assert from "node:assert/strict"
import { test } from "node:test"
import { programmeListWhere, startingPriceKobo } from "./programme-query"

test("the public list hides drafts and archives", () => {
  const json = JSON.stringify(programmeListWhere({}))
  assert.match(json, /PUBLISHED/)
  assert.match(json, /CLOSED/)
  assert.doesNotMatch(json, /DRAFT/)
  assert.doesNotMatch(json, /ARCHIVED/)
})

test("search matches church, code and title", () => {
  const json = JSON.stringify(programmeListWhere({ q: "CROSS26" }))
  assert.match(json, /CROSS26/)
  assert.match(json, /church/)
})

test("starting price prefers an override", () => {
  assert.equal(
    startingPriceKobo([
      { priceKoboOverride: 700000, variant: { priceKobo: 650000 } },
      { priceKoboOverride: null, variant: { priceKobo: 950000 } },
    ]),
    700000,
  )
})
