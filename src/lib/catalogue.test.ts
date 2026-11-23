import assert from "node:assert/strict"
import { test } from "node:test"
import {
  MENU_ITEMS,
  ORDER_CUTOFF_HOURS,
  PROGRAMMES,
  SERVICE_WINDOWS,
  periodsFor,
} from "./catalogue"

test("delivery windows are morning, afternoon and evening with a 24 hour cutoff", () => {
  assert.deepEqual(
    SERVICE_WINDOWS.map((window) => [window.name, window.start, window.end, window.short]),
    [
      ["Morning", "07:00", "10:00", "7–10am"],
      ["Afternoon", "13:00", "15:00", "1–3pm"],
      ["Evening", "18:00", "20:00", "6–8pm"],
    ],
  )
  assert.equal(ORDER_CUTOFF_HOURS, 24)
})

test("all-hours plates and extras can be ordered in every slot", () => {
  const allHours = [
    "boiled-white-rice-plantain-beef",
    "diba-party-jollof-chicken",
    "basmati-chicken-delish",
    "boiled-yam-egg-sauce",
  ]
  for (const slug of allHours) {
    const item = MENU_ITEMS.find((entry) => entry.slug === slug)
    assert.ok(item)
    assert.deepEqual(periodsFor(item), ["Morning", "Afternoon", "Evening"])
  }
  for (const item of MENU_ITEMS.filter((entry) => entry.category === "extras")) {
    assert.deepEqual(periodsFor(item), ["Morning", "Afternoon", "Evening"])
  }
})

test("the other plates stay in their meal slot", () => {
  const expectWindow = (slug: string, window: string) => {
    const item = MENU_ITEMS.find((entry) => entry.slug === slug)
    assert.ok(item)
    assert.deepEqual(periodsFor(item), [window])
  }
  expectWindow("oats-moi-moi", "Morning")
  expectWindow("beans-plantain-eja-kika", "Afternoon")
  expectWindow("ofada-ayamase", "Evening")
})

test("prices match the client menu in kobo", () => {
  const price = (slug: string) => MENU_ITEMS.find((entry) => entry.slug === slug)?.priceKobo
  assert.equal(price("oats-moi-moi"), 300_000)
  assert.equal(price("pap-custard-moi-moi"), 300_000)
  assert.equal(price("boiled-plantain-egg-sauce"), 350_000)
  assert.equal(price("yamarita"), 450_000)
  assert.equal(price("boiled-white-rice-plantain-beef"), 345_000)
  assert.equal(price("beans-plantain-eja-kika"), 420_000)
  assert.equal(price("rice-beans-plantain"), 450_000)
  assert.equal(price("diba-party-jollof-chicken"), 500_000)
  assert.equal(price("white-rice-ayamase"), 455_000)
  assert.equal(price("stir-fry-pasta-turkey"), 600_000)
  assert.equal(price("suya-rice-peppered-chicken"), 500_000)
  assert.equal(price("chicken-shawarma-wrap"), 450_000)
  assert.equal(price("basmati-chicken-delish"), 650_000)
  assert.equal(price("boiled-yam-egg-sauce"), 400_000)
  assert.equal(price("ofada-ayamase"), 500_000)
  assert.equal(price("hake-fish"), 250_000)
  assert.equal(price("peppered-chicken"), 300_000)
  assert.equal(price("panla-fish"), 200_000)
  assert.equal(price("fried-beef"), 100_000)
  assert.equal(price("boiled-egg"), 50_000)
  assert.equal(price("sweet-plantain"), 100_000)
  assert.equal(price("tofu"), 200_000)
  assert.equal(MENU_ITEMS.length, 22)
})

test("the three December programmes replace the demo set", () => {
  assert.deepEqual(
    PROGRAMMES.map((programme) => [programme.code, programme.startDate, programme.endDate]),
    [
      ["REBOOT26", "2026-12-03", "2026-12-06"],
      ["HGC26", "2026-12-07", "2026-12-12"],
      ["FEAST26", "2026-12-11", "2026-12-13"],
    ],
  )
  const slugs = MENU_ITEMS.map((item) => item.slug)
  assert.equal(new Set(slugs).size, slugs.length)
})
