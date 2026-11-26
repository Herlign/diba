import assert from "node:assert/strict"
import { test } from "node:test"
import { MARKETING } from "./catalogue"
import { DEFAULT_FAQS, DEFAULT_SITE_CONTENT } from "./site-copy"

test("homepage defaults match the previous marketing copy", () => {
  assert.equal(DEFAULT_SITE_CONTENT.eyebrow, MARKETING.eyebrow)
  assert.equal(DEFAULT_SITE_CONTENT.headlineLead, MARKETING.headlineLead)
  assert.equal(DEFAULT_SITE_CONTENT.headlineRest, MARKETING.headlineRest)
  assert.equal(DEFAULT_SITE_CONTENT.hero, MARKETING.hero)
  assert.equal(DEFAULT_SITE_CONTENT.footer, MARKETING.footer)
  assert.deepEqual(
    DEFAULT_FAQS.map((faq) => faq.question),
    ["When does ordering close?", "Where do I collect?", "What about refunds?", "Can I order for a group?"],
  )
  assert.match(DEFAULT_FAQS[0].answer, /24 hours/)
  assert.match(DEFAULT_FAQS[0].answer, /7:00am/)
})
