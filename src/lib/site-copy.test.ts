import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { MARKETING } from "./catalogue"
import {
  DEFAULT_FAQS,
  DEFAULT_MARQUEE,
  DEFAULT_SHOWCASES,
  DEFAULT_SITE_CONTENT,
  DEFAULT_SLIP_LINES,
  DEFAULT_STEPS,
  DEFAULT_TRUST,
} from "./site-copy"
import { joinParts, nextImageUrl, resolveWhatsappNumber, withStop } from "./site-text"

test("homepage defaults match the previous marketing copy", () => {
  assert.equal(DEFAULT_SITE_CONTENT.eyebrow, MARKETING.eyebrow)
  assert.equal(DEFAULT_SITE_CONTENT.headlineLead, MARKETING.headlineLead)
  assert.equal(DEFAULT_SITE_CONTENT.headlineRest, "Never miss a moment")
  assert.equal(DEFAULT_SITE_CONTENT.hero, MARKETING.hero)
  assert.equal(DEFAULT_SITE_CONTENT.footer, MARKETING.footer)
  assert.equal(DEFAULT_SITE_CONTENT.searchPlaceholder, "Find your programme — church, name or code")
  assert.equal(DEFAULT_SITE_CONTENT.slipTitle, "Reboot Camp · Surulere")
  assert.deepEqual(
    DEFAULT_STEPS.map((step) => step.title),
    ["Pick your days", "Choose meals", "We deliver at the venue"],
  )
  assert.equal(DEFAULT_SHOWCASES[2]?.imageFocus, "center 62%")
  assert.deepEqual(
    DEFAULT_SLIP_LINES.map((line) => line.plate),
    ["Oats & moi-moi", "Party jollof", "Suya rice"],
  )
  assert.equal(DEFAULT_MARQUEE[0]?.label, "Party jollof")
  assert.match(DEFAULT_TRUST[1]?.label ?? "", /Morning 7–10am/)
  assert.deepEqual(
    DEFAULT_FAQS.map((faq) => faq.question),
    ["When does ordering close?", "Where do I collect?", "What about refunds?", "Can I order for a group?"],
  )
  assert.match(DEFAULT_FAQS[0].answer, /24 hours/)
  assert.match(DEFAULT_FAQS[0].answer, /7:00am/)
})

test("shared descriptions do not gain a second full stop", () => {
  const footer = DEFAULT_SITE_CONTENT.footer
  const edited = "Your meals, sorted for the whole programme."
  assert.equal(withStop(edited), edited)
  assert.equal(withStop("Never miss a moment"), "Never miss a moment.")
  assert.equal(withStop("What?"), "What?")
  assert.equal(
    joinParts([DEFAULT_SITE_CONTENT.headlineLead, edited, footer]),
    "Never miss a meal. Your meals, sorted for the whole programme. Freshly prepared meals, delivered to designated points within your programme venue.",
  )
  assert.equal(joinParts(["Never miss a meal.", "Never miss a moment", footer]).includes("moment.."), false)
  assert.equal(joinParts(["", "Hello"]).includes(".."), false)
})

test("a blank WhatsApp number keeps the server setting", () => {
  assert.equal(resolveWhatsappNumber("", "2348090002210"), "2348090002210")
  assert.equal(resolveWhatsappNumber("2348000000000", "2348090002210"), "2348000000000")
  assert.equal(resolveWhatsappNumber("+234 800 000 0000", undefined), "2348000000000")
  assert.equal(resolveWhatsappNumber("", undefined), "2348090002210")
})

test("removing a photo restores the original unless a new file was saved", () => {
  assert.equal(nextImageUrl({ current: "https://blob/new.jpg", uploaded: null, remove: true, fallback: "/images/jollof.jpg" }), "/images/jollof.jpg")
  assert.equal(nextImageUrl({ current: "/images/jollof.jpg", uploaded: "https://blob/new.jpg", remove: true, fallback: "/images/jollof.jpg" }), "https://blob/new.jpg")
  assert.equal(nextImageUrl({ current: "", uploaded: null, remove: false, fallback: "" }), "")
})

test("the homepage migration backfills copy and does not overwrite a saved headline", () => {
  const sql = readFileSync("prisma/migrations/20261127163000_editable_homepage/migration.sql", "utf8")
  const schema = readFileSync("prisma/schema.prisma", "utf8")
  const kept = new Set(["eyebrow", "headlineLead", "headlineRest", "hero", "footer"])
  assert.equal(/^\s*UPDATE\b/im.test(sql), false)
  assert.equal(sql.includes("Your meals, sorted for the whole programme."), false)
  assert.equal(sql.includes('ON CONFLICT ("id") DO NOTHING'), true)
  for (const [key, value] of Object.entries(DEFAULT_SITE_CONTENT)) {
    if (!value) continue
    assert.equal(sql.includes(value), true, key)
    if (!kept.has(key)) assert.equal(schema.includes(value), true, key)
  }
  for (const step of DEFAULT_STEPS) {
    assert.equal(sql.includes(step.title), true)
    assert.equal(sql.includes(step.body), true)
  }
  for (const plate of DEFAULT_SHOWCASES) {
    assert.equal(sql.includes(plate.name), true)
    assert.equal(sql.includes(plate.imageAlt), true)
    assert.equal(sql.includes(plate.imageFocus) || plate.imageFocus === "", true)
  }
})
