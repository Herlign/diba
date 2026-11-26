import type { Prisma, PrismaClient } from "@prisma/client"
import { DEFAULT_FAQS, DEFAULT_SITE_CONTENT, SITE_ID } from "@/lib/site-copy"

type Db = PrismaClient | Prisma.TransactionClient

/** Inserts the original homepage copy when the tables are empty. Does not overwrite edits. */
export async function ensureSiteContent(db: Db) {
  await db.siteContent.upsert({
    where: { id: SITE_ID },
    create: { id: SITE_ID, ...DEFAULT_SITE_CONTENT },
    update: {},
  })
  const count = await db.faqEntry.count({ where: { siteId: SITE_ID } })
  if (count > 0) return
  await db.faqEntry.createMany({
    data: DEFAULT_FAQS.map((faq, position) => ({
      id: faq.id,
      siteId: SITE_ID,
      question: faq.question,
      answer: faq.answer,
      position,
    })),
  })
}
