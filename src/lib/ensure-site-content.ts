import type { Prisma, PrismaClient } from "@prisma/client"
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

type Db = PrismaClient | Prisma.TransactionClient

/**
 * Inserts the original website copy when a block is missing.
 * An existing row or an existing item is left as it was saved.
 */
export async function ensureSiteContent(db: Db) {
  const existing = await db.siteContent.findUnique({ where: { id: SITE_ID } })
  if (!existing) {
    await db.siteContent.create({ data: { id: SITE_ID, ...DEFAULT_SITE_CONTENT } })
  }

  if ((await db.faqEntry.count({ where: { siteId: SITE_ID } })) === 0) {
    await db.faqEntry.createMany({
      data: DEFAULT_FAQS.map((faq, position) => ({
        id: faq.id,
        siteId: SITE_ID,
        question: faq.question,
        answer: faq.answer,
        position,
      })),
      skipDuplicates: true,
    })
  }

  if ((await db.homeStep.count({ where: { siteId: SITE_ID } })) === 0) {
    await db.homeStep.createMany({
      data: DEFAULT_STEPS.map((step, position) => ({
        id: step.id,
        siteId: SITE_ID,
        title: step.title,
        body: step.body,
        position,
      })),
      skipDuplicates: true,
    })
  }

  if ((await db.homeShowcase.count({ where: { siteId: SITE_ID } })) === 0) {
    await db.homeShowcase.createMany({
      data: DEFAULT_SHOWCASES.map((plate, position) => ({
        id: plate.id,
        siteId: SITE_ID,
        name: plate.name,
        note: plate.note,
        imageUrl: plate.imageUrl,
        imageAlt: plate.imageAlt,
        imageFocus: plate.imageFocus,
        position,
      })),
      skipDuplicates: true,
    })
  }

  if ((await db.homeSlipLine.count({ where: { siteId: SITE_ID } })) === 0) {
    await db.homeSlipLine.createMany({
      data: DEFAULT_SLIP_LINES.map((line, position) => ({
        id: line.id,
        siteId: SITE_ID,
        whenLabel: line.whenLabel,
        plate: line.plate,
        position,
      })),
      skipDuplicates: true,
    })
  }

  if ((await db.homeMarqueeItem.count({ where: { siteId: SITE_ID } })) === 0) {
    await db.homeMarqueeItem.createMany({
      data: DEFAULT_MARQUEE.map((item, position) => ({
        id: item.id,
        siteId: SITE_ID,
        label: item.label,
        position,
      })),
      skipDuplicates: true,
    })
  }

  if ((await db.homeTrustPoint.count({ where: { siteId: SITE_ID } })) === 0) {
    await db.homeTrustPoint.createMany({
      data: DEFAULT_TRUST.map((item, position) => ({
        id: item.id,
        siteId: SITE_ID,
        label: item.label,
        position,
      })),
      skipDuplicates: true,
    })
  }
}
