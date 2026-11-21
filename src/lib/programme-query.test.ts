import assert from "node:assert/strict"
import { test } from "node:test"
import { ProgrammeStatus } from "./domain"
import {
  mealRhythm,
  plateNames,
  programmeListWhere,
  sortProgrammes,
  startingPriceKobo,
} from "./programme-query"

const now = new Date("2026-11-21T12:00:00.000Z")

test("public listing never includes drafts", () => {
  const where = programmeListWhere({ status: "all", now })
  const json = JSON.stringify(where)
  assert.match(json, /ORDERING_OPEN/)
  assert.doesNotMatch(json, /DRAFT/)
})

test("open filter requires ordering to be open", () => {
  const where = programmeListWhere({ status: "open", city: "Ibadan", q: "camp", now })
  const json = JSON.stringify(where)
  assert.match(json, /ORDERING_OPEN/)
  assert.match(json, /Ibadan/)
  assert.match(json, /camp/)
})

test("starting price ignores drinks and uses an override", () => {
  const price = startingPriceKobo({
    days: [
      {
        slots: [
          {
            kind: "LUNCH",
            offerings: [
              {
                priceKoboOverride: 410000,
                menuItem: { priceKobo: 350000, category: "PLATE", name: "Jollof" },
              },
              {
                priceKoboOverride: null,
                menuItem: { priceKobo: 50000, category: "DRINK", name: "Zobo" },
              },
            ],
          },
        ],
      },
    ],
  })
  assert.equal(price, 410000)
})

test("meal rhythm and plate names summarise the schedule", () => {
  const programme = {
    days: [
      {
        slots: [
          {
            kind: "LUNCH",
            offerings: [
              {
                priceKoboOverride: null,
                menuItem: { priceKobo: 1, category: "PLATE", name: "Jollof" },
              },
            ],
          },
          {
            kind: "DINNER",
            offerings: [
              {
                priceKoboOverride: null,
                menuItem: { priceKobo: 1, category: "PLATE", name: "Egusi" },
              },
            ],
          },
        ],
      },
      { slots: [] },
    ],
  }
  assert.equal(mealRhythm(programme), "Lunch · Dinner · 2 days")
  assert.deepEqual(plateNames(programme), ["Jollof", "Egusi"])
})

test("sort puts programmes still ahead before ones already held", () => {
  const rows = sortProgrammes(
    [
      {
        slug: "past",
        startsOn: new Date("2026-11-01T00:00:00.000Z"),
        endsOn: new Date("2026-11-02T00:00:00.000Z"),
        status: ProgrammeStatus.COMPLETED,
      },
      {
        slug: "later",
        startsOn: new Date("2026-12-04T00:00:00.000Z"),
        endsOn: new Date("2026-12-06T00:00:00.000Z"),
        status: ProgrammeStatus.ORDERING_OPEN,
      },
      {
        slug: "sooner",
        startsOn: new Date("2026-11-27T00:00:00.000Z"),
        endsOn: new Date("2026-11-29T00:00:00.000Z"),
        status: ProgrammeStatus.ORDERING_OPEN,
      },
    ],
    now,
  )
  assert.deepEqual(
    rows.map((row) => row.slug),
    ["sooner", "later", "past"],
  )
})
