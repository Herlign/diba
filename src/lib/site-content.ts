import "server-only"

import type { Prisma } from "@prisma/client"
import { cacheTag } from "next/cache"
import { prisma } from "@/lib/prisma"
import {
  DEFAULT_FAQS,
  DEFAULT_MARQUEE,
  DEFAULT_SHOWCASES,
  DEFAULT_SITE_CONTENT,
  DEFAULT_SLIP_LINES,
  DEFAULT_STEPS,
  DEFAULT_TRUST,
  SITE_ID,
} from "@/lib/site-copy"
import { resolveWhatsappNumber } from "@/lib/site-text"

const siteInclude = {
  faqs: { orderBy: { position: "asc" as const } },
  steps: { orderBy: { position: "asc" as const } },
  showcases: { orderBy: { position: "asc" as const } },
  slipLines: { orderBy: { position: "asc" as const } },
  marqueeItems: { orderBy: { position: "asc" as const } },
  trustPoints: { orderBy: { position: "asc" as const } },
}

export type SiteRow = Prisma.SiteContentGetPayload<{ include: typeof siteInclude }>

type SiteStrings = { [K in keyof typeof DEFAULT_SITE_CONTENT]: string }

export type SiteCopy = SiteStrings & {
  logoUrl: string | null
  ogImageUrl: string | null
  faviconUrl: string | null
  whatsappNumber: string
  faqs: { id: string; question: string; answer: string }[]
  steps: { id: string; title: string; body: string }[]
  showcases: { id: string; name: string; note: string; imageUrl: string; imageAlt: string; imageFocus: string }[]
  slipLines: { id: string; whenLabel: string; plate: string }[]
  marquee: { id: string; label: string }[]
  trust: { id: string; label: string }[]
}

function stringsFrom(row: SiteRow): SiteStrings {
  const copy: SiteStrings = { ...DEFAULT_SITE_CONTENT }
  for (const key of Object.keys(copy) as (keyof typeof DEFAULT_SITE_CONTENT)[]) {
    copy[key] = row[key]
  }
  return copy
}

export function toSiteCopy(row: SiteRow): SiteCopy {
  return {
    ...stringsFrom(row),
    logoUrl: row.logoUrl,
    ogImageUrl: row.ogImageUrl,
    faviconUrl: row.faviconUrl,
    whatsappNumber: resolveWhatsappNumber(row.whatsappE164, process.env.NEXT_PUBLIC_WHATSAPP_E164),
    faqs: row.faqs.map((faq) => ({ id: faq.id, question: faq.question, answer: faq.answer })),
    steps: row.steps.map((step) => ({ id: step.id, title: step.title, body: step.body })),
    showcases: row.showcases.map((plate) => ({
      id: plate.id,
      name: plate.name,
      note: plate.note,
      imageUrl: plate.imageUrl,
      imageAlt: plate.imageAlt,
      imageFocus: plate.imageFocus,
    })),
    slipLines: row.slipLines.map((line) => ({ id: line.id, whenLabel: line.whenLabel, plate: line.plate })),
    marquee: row.marqueeItems.map((item) => ({ id: item.id, label: item.label })),
    trust: row.trustPoints.map((item) => ({ id: item.id, label: item.label })),
  }
}

/** Used when the database has no website row yet, or cannot be reached. */
export function fallbackCopy(): SiteCopy {
  return {
    ...DEFAULT_SITE_CONTENT,
    logoUrl: null,
    ogImageUrl: null,
    faviconUrl: null,
    whatsappNumber: resolveWhatsappNumber("", process.env.NEXT_PUBLIC_WHATSAPP_E164),
    faqs: DEFAULT_FAQS.map((faq) => ({ id: faq.id, question: faq.question, answer: faq.answer })),
    steps: DEFAULT_STEPS.map((step) => ({ id: step.id, title: step.title, body: step.body })),
    showcases: DEFAULT_SHOWCASES.map((plate) => ({ ...plate })),
    slipLines: DEFAULT_SLIP_LINES.map((line) => ({ ...line })),
    marquee: DEFAULT_MARQUEE.map((item) => ({ ...item })),
    trust: DEFAULT_TRUST.map((item) => ({ ...item })),
  }
}

export const siteContentInclude = siteInclude

/** Public website copy. Cached until a manager saves, then updateTag refreshes it. */
export async function getSiteContent(): Promise<SiteCopy> {
  "use cache"
  cacheTag("site-content")
  try {
    const row = await prisma.siteContent.findUnique({
      where: { id: SITE_ID },
      include: siteInclude,
    })
    if (!row) return fallbackCopy()
    return toSiteCopy(row)
  } catch {
    return fallbackCopy()
  }
}
