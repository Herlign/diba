import assert from "node:assert/strict"
import { test } from "node:test"
import { eachDay, isoDate, utcDate } from "./calendar"
import { programmeCode, slugify } from "./slug"

test("slugs come from the dish name", () => {
  assert.equal(slugify("Boiled plantain & egg sauce + tea"), "boiled-plantain-and-egg-sauce-tea")
  assert.equal(slugify("  Diba Party Jollof & Chicken  "), "diba-party-jollof-and-chicken")
  assert.equal(programmeCode("reboot 26!"), "REBOOT26")
})

test("programme days stay inside a month", () => {
  assert.deepEqual(eachDay("2026-12-03", "2026-12-06"), ["2026-12-03", "2026-12-04", "2026-12-05", "2026-12-06"])
  assert.equal(eachDay("2026-12-06", "2026-12-03").length, 0)
  assert.equal(eachDay("2026-01-01", "2026-03-01").length, 0)
  assert.equal(isoDate(utcDate("2026-12-03")!), "2026-12-03")
})
