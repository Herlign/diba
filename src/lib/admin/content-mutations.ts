"use server"

import { prisma } from "@/lib/prisma"
import { failTo, noticeTo, requireManager } from "@/lib/admin/guard"
import { revalidateContent } from "@/lib/admin/revalidate"
import { SITE_ID } from "@/lib/site-copy"

export async function saveSiteContent(formData: FormData) {
  await requireManager("/admin/content")
  const eyebrow = String(formData.get("eyebrow") ?? "").trim()
  const headlineLead = String(formData.get("headlineLead") ?? "").trim()
  const headlineRest = String(formData.get("headlineRest") ?? "").trim()
  const hero = String(formData.get("hero") ?? "").trim()
  const footer = String(formData.get("footer") ?? "").trim()
  if (!eyebrow || !headlineLead || !headlineRest || !hero || !footer) {
    failTo("/admin/content", "Fill in every homepage line.")
  }
  if (eyebrow.length > 120 || headlineLead.length > 80 || headlineRest.length > 80) {
    failTo("/admin/content", "Shorten the title lines.")
  }
  if (hero.length > 800 || footer.length > 300) failTo("/admin/content", "Shorten the paragraph or the footer line.")

  const ids = formData.getAll("faqId").map((value) => String(value))
  const questions = formData.getAll("question").map((value) => String(value).trim())
  const answers = formData.getAll("answer").map((value) => String(value).trim())
  const dropped = new Set(formData.getAll("drop").map((value) => String(value)))
  const rows = questions.map((question, index) => ({
    id: ids[index] ?? "",
    question,
    answer: answers[index] ?? "",
  }))
  if (rows.some((row) => (row.question && !row.answer) || (!row.question && row.answer))) {
    failTo("/admin/content", "Each question needs an answer.")
  }
  const faqs = rows.filter((row) => row.question && row.answer && !dropped.has(row.id))
  if (faqs.length === 0) failTo("/admin/content", "Keep at least one question.")
  if (faqs.some((faq) => faq.question.length > 160 || faq.answer.length > 800)) {
    failTo("/admin/content", "Shorten a question or answer.")
  }

  await prisma.$transaction(async (tx) => {
    await tx.siteContent.upsert({
      where: { id: SITE_ID },
      create: { id: SITE_ID, eyebrow, headlineLead, headlineRest, hero, footer },
      update: { eyebrow, headlineLead, headlineRest, hero, footer },
    })
    const keep = faqs.map((faq) => faq.id).filter(Boolean)
    await tx.faqEntry.deleteMany({
      where: { siteId: SITE_ID, ...(keep.length > 0 ? { id: { notIn: keep } } : {}) },
    })
    for (const [position, faq] of faqs.entries()) {
      if (faq.id) {
        const owned = await tx.faqEntry.findFirst({ where: { id: faq.id, siteId: SITE_ID } })
        if (!owned) {
          await tx.faqEntry.create({
            data: { siteId: SITE_ID, question: faq.question, answer: faq.answer, position },
          })
          continue
        }
        await tx.faqEntry.update({
          where: { id: faq.id },
          data: { question: faq.question, answer: faq.answer, position },
        })
      } else {
        await tx.faqEntry.create({
          data: { siteId: SITE_ID, question: faq.question, answer: faq.answer, position },
        })
      }
    }
  })
  revalidateContent()
  noticeTo("/admin/content", "Homepage saved. The public site will show this text.")
}
