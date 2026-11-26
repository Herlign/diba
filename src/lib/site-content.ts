import "server-only"

import { cacheTag } from "next/cache"
import { prisma } from "@/lib/prisma"
import { DEFAULT_FAQS, DEFAULT_SITE_CONTENT, SITE_ID } from "@/lib/site-copy"

export type SiteFaq = { id: string; question: string; answer: string }

export type SiteCopy = {
  eyebrow: string
  headlineLead: string
  headlineRest: string
  hero: string
  footer: string
  faqs: SiteFaq[]
}

const fallback = (): SiteCopy => ({
  ...DEFAULT_SITE_CONTENT,
  faqs: DEFAULT_FAQS.map((faq) => ({ id: faq.id, question: faq.question, answer: faq.answer })),
})

/** Public homepage copy. Cached until a manager saves, then updateTag refreshes it. */
export async function getSiteContent(): Promise<SiteCopy> {
  "use cache"
  cacheTag("site-content")
  try {
    const row = await prisma.siteContent.findUnique({
      where: { id: SITE_ID },
      include: { faqs: { orderBy: { position: "asc" } } },
    })
    if (!row) return fallback()
    return {
      eyebrow: row.eyebrow,
      headlineLead: row.headlineLead,
      headlineRest: row.headlineRest,
      hero: row.hero,
      footer: row.footer,
      faqs: row.faqs.map((faq) => ({ id: faq.id, question: faq.question, answer: faq.answer })),
    }
  } catch {
    return fallback()
  }
}
