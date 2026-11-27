"use server"

import { prisma } from "@/lib/prisma"
import { noticeTo, requireManager } from "@/lib/admin/guard"
import { revalidateContent } from "@/lib/admin/revalidate"
import { requiredText, roomFor, storedImage } from "@/lib/admin/content-save"
import { COPY_LIMITS, SITE_ID, STAND_IN_PLATE_IMAGE } from "@/lib/site-copy"
import { contentPath } from "@/lib/site-text"

function swapped(rows: { id: string }[], id: string, direction: string) {
  const index = rows.findIndex((row) => row.id === id)
  const target = direction === "up" ? index - 1 : index + 1
  if (index < 0 || target < 0 || target >= rows.length) return null
  const next = [...rows]
  const [moved] = next.splice(index, 1)
  if (!moved) return null
  next.splice(target, 0, moved)
  return next
}

async function finish(section: string, notice: string) {
  revalidateContent()
  noticeTo(contentPath(section), notice)
}

export async function saveStep(formData: FormData) {
  const section = "steps"
  await requireManager(contentPath(section))
  const id = String(formData.get("id") ?? "").trim()
  const title = requiredText(formData, "title", COPY_LIMITS.stepTitle, section, "Add a title for this step.")
  const body = requiredText(formData, "body", COPY_LIMITS.stepBody, section, "Add the words for this step.")
  if (id) {
    const owned = await prisma.homeStep.findFirst({ where: { id, siteId: SITE_ID } })
    if (owned) {
      await prisma.homeStep.update({ where: { id }, data: { title, body } })
      await finish(section, "Step saved.")
    }
  }
  const total = await prisma.homeStep.count({ where: { siteId: SITE_ID } })
  await roomFor(section, total, 8)
  await prisma.homeStep.create({ data: { ...(id ? { id } : {}), siteId: SITE_ID, title, body, position: total } })
  await finish(section, "Step added.")
}

export async function moveStep(formData: FormData) {
  const section = "steps"
  await requireManager(contentPath(section))
  const rows = await prisma.homeStep.findMany({ where: { siteId: SITE_ID }, orderBy: { position: "asc" } })
  const next = swapped(rows, String(formData.get("id") ?? ""), String(formData.get("direction") ?? ""))
  if (!next) return
  await prisma.$transaction(next.map((row, position) => prisma.homeStep.update({ where: { id: row.id }, data: { position } })))
  await finish(section, "Order saved.")
}

export async function deleteStep(formData: FormData) {
  const section = "steps"
  await requireManager(contentPath(section))
  await prisma.homeStep.deleteMany({ where: { id: String(formData.get("id") ?? ""), siteId: SITE_ID } })
  const rows = await prisma.homeStep.findMany({ where: { siteId: SITE_ID }, orderBy: { position: "asc" } })
  if (rows.length > 0) {
    await prisma.$transaction(rows.map((row, position) => prisma.homeStep.update({ where: { id: row.id }, data: { position } })))
  }
  await finish(section, "Step removed.")
}

export async function saveShowcase(formData: FormData) {
  const section = "plates"
  await requireManager(contentPath(section))
  const id = String(formData.get("id") ?? "").trim()
  const name = requiredText(formData, "name", COPY_LIMITS.plateName, section, "Add the plate name.")
  const note = requiredText(formData, "note", COPY_LIMITS.plateNote, section, "Add the line under the plate name.")
  const imageAlt = requiredText(formData, "imageAlt", COPY_LIMITS.plateAlt, section, "Describe the photo.")
  const image = await storedImage(formData, `site/plate-${id || "new"}`, section, STAND_IN_PLATE_IMAGE)
  const owned = id ? await prisma.homeShowcase.findFirst({ where: { id, siteId: SITE_ID } }) : null
  const imageFocus = owned && owned.imageUrl === image.url ? owned.imageFocus : ""
  const data = { name, note, imageAlt, imageUrl: image.url, imageFocus }
  if (owned) {
    await prisma.homeShowcase.update({ where: { id: owned.id }, data })
    await finish(section, `Plate saved.${image.notice}`)
  }
  const total = await prisma.homeShowcase.count({ where: { siteId: SITE_ID } })
  await roomFor(section, total, 12)
  await prisma.homeShowcase.create({
    data: { ...(id ? { id } : {}), siteId: SITE_ID, ...data, position: total },
  })
  const standIn = image.url === STAND_IN_PLATE_IMAGE && !String(formData.get("currentImage") ?? "") ? " It is using a stand-in photo until you upload one." : ""
  await finish(section, `Plate added.${image.notice}${standIn}`)
}

export async function moveShowcase(formData: FormData) {
  const section = "plates"
  await requireManager(contentPath(section))
  const rows = await prisma.homeShowcase.findMany({ where: { siteId: SITE_ID }, orderBy: { position: "asc" } })
  const next = swapped(rows, String(formData.get("id") ?? ""), String(formData.get("direction") ?? ""))
  if (!next) return
  await prisma.$transaction(next.map((row, position) => prisma.homeShowcase.update({ where: { id: row.id }, data: { position } })))
  await finish(section, "Order saved.")
}

export async function deleteShowcase(formData: FormData) {
  const section = "plates"
  await requireManager(contentPath(section))
  await prisma.homeShowcase.deleteMany({ where: { id: String(formData.get("id") ?? ""), siteId: SITE_ID } })
  const rows = await prisma.homeShowcase.findMany({ where: { siteId: SITE_ID }, orderBy: { position: "asc" } })
  if (rows.length > 0) {
    await prisma.$transaction(rows.map((row, position) => prisma.homeShowcase.update({ where: { id: row.id }, data: { position } })))
  }
  await finish(section, "Plate removed.")
}

export async function saveSlipLine(formData: FormData) {
  const section = "sample"
  await requireManager(contentPath(section))
  const id = String(formData.get("id") ?? "").trim()
  const whenLabel = requiredText(formData, "whenLabel", COPY_LIMITS.slipWhen, section, "Add the day and slot.")
  const plate = requiredText(formData, "plate", COPY_LIMITS.slipPlate, section, "Add the meal on that line.")
  if (id) {
    const owned = await prisma.homeSlipLine.findFirst({ where: { id, siteId: SITE_ID } })
    if (owned) {
      await prisma.homeSlipLine.update({ where: { id }, data: { whenLabel, plate } })
      await finish(section, "Sample line saved.")
    }
  }
  const total = await prisma.homeSlipLine.count({ where: { siteId: SITE_ID } })
  await roomFor(section, total, 6)
  await prisma.homeSlipLine.create({ data: { ...(id ? { id } : {}), siteId: SITE_ID, whenLabel, plate, position: total } })
  await finish(section, "Sample line added.")
}

export async function moveSlipLine(formData: FormData) {
  const section = "sample"
  await requireManager(contentPath(section))
  const rows = await prisma.homeSlipLine.findMany({ where: { siteId: SITE_ID }, orderBy: { position: "asc" } })
  const next = swapped(rows, String(formData.get("id") ?? ""), String(formData.get("direction") ?? ""))
  if (!next) return
  await prisma.$transaction(next.map((row, position) => prisma.homeSlipLine.update({ where: { id: row.id }, data: { position } })))
  await finish(section, "Order saved.")
}

export async function deleteSlipLine(formData: FormData) {
  const section = "sample"
  await requireManager(contentPath(section))
  await prisma.homeSlipLine.deleteMany({ where: { id: String(formData.get("id") ?? ""), siteId: SITE_ID } })
  const rows = await prisma.homeSlipLine.findMany({ where: { siteId: SITE_ID }, orderBy: { position: "asc" } })
  if (rows.length > 0) {
    await prisma.$transaction(rows.map((row, position) => prisma.homeSlipLine.update({ where: { id: row.id }, data: { position } })))
  }
  await finish(section, "Sample line removed.")
}

export async function saveMarquee(formData: FormData) {
  const section = "marquee"
  await requireManager(contentPath(section))
  const id = String(formData.get("id") ?? "").trim()
  const label = requiredText(formData, "label", COPY_LIMITS.marqueeLabel, section, "Add a dish name.")
  if (id) {
    const owned = await prisma.homeMarqueeItem.findFirst({ where: { id, siteId: SITE_ID } })
    if (owned) {
      await prisma.homeMarqueeItem.update({ where: { id }, data: { label } })
      await finish(section, "Dish name saved.")
    }
  }
  const total = await prisma.homeMarqueeItem.count({ where: { siteId: SITE_ID } })
  await roomFor(section, total, 16)
  await prisma.homeMarqueeItem.create({ data: { ...(id ? { id } : {}), siteId: SITE_ID, label, position: total } })
  await finish(section, "Dish name added.")
}

export async function moveMarquee(formData: FormData) {
  const section = "marquee"
  await requireManager(contentPath(section))
  const rows = await prisma.homeMarqueeItem.findMany({ where: { siteId: SITE_ID }, orderBy: { position: "asc" } })
  const next = swapped(rows, String(formData.get("id") ?? ""), String(formData.get("direction") ?? ""))
  if (!next) return
  await prisma.$transaction(next.map((row, position) => prisma.homeMarqueeItem.update({ where: { id: row.id }, data: { position } })))
  await finish(section, "Order saved.")
}

export async function deleteMarquee(formData: FormData) {
  const section = "marquee"
  await requireManager(contentPath(section))
  await prisma.homeMarqueeItem.deleteMany({ where: { id: String(formData.get("id") ?? ""), siteId: SITE_ID } })
  const rows = await prisma.homeMarqueeItem.findMany({ where: { siteId: SITE_ID }, orderBy: { position: "asc" } })
  if (rows.length > 0) {
    await prisma.$transaction(rows.map((row, position) => prisma.homeMarqueeItem.update({ where: { id: row.id }, data: { position } })))
  }
  await finish(section, "Dish name removed.")
}

export async function saveTrust(formData: FormData) {
  const section = "hero"
  await requireManager(contentPath(section))
  const id = String(formData.get("id") ?? "").trim()
  const label = requiredText(formData, "label", COPY_LIMITS.trustLabel, section, "Add the short line.")
  if (id) {
    const owned = await prisma.homeTrustPoint.findFirst({ where: { id, siteId: SITE_ID } })
    if (owned) {
      await prisma.homeTrustPoint.update({ where: { id }, data: { label } })
      await finish(section, "Line saved.")
    }
  }
  const total = await prisma.homeTrustPoint.count({ where: { siteId: SITE_ID } })
  await roomFor(section, total, 6)
  await prisma.homeTrustPoint.create({ data: { ...(id ? { id } : {}), siteId: SITE_ID, label, position: total } })
  await finish(section, "Line added.")
}

export async function moveTrust(formData: FormData) {
  const section = "hero"
  await requireManager(contentPath(section))
  const rows = await prisma.homeTrustPoint.findMany({ where: { siteId: SITE_ID }, orderBy: { position: "asc" } })
  const next = swapped(rows, String(formData.get("id") ?? ""), String(formData.get("direction") ?? ""))
  if (!next) return
  await prisma.$transaction(next.map((row, position) => prisma.homeTrustPoint.update({ where: { id: row.id }, data: { position } })))
  await finish(section, "Order saved.")
}

export async function deleteTrust(formData: FormData) {
  const section = "hero"
  await requireManager(contentPath(section))
  await prisma.homeTrustPoint.deleteMany({ where: { id: String(formData.get("id") ?? ""), siteId: SITE_ID } })
  const rows = await prisma.homeTrustPoint.findMany({ where: { siteId: SITE_ID }, orderBy: { position: "asc" } })
  if (rows.length > 0) {
    await prisma.$transaction(rows.map((row, position) => prisma.homeTrustPoint.update({ where: { id: row.id }, data: { position } })))
  }
  await finish(section, "Line removed.")
}

export async function saveFaq(formData: FormData) {
  const section = "questions"
  await requireManager(contentPath(section))
  const id = String(formData.get("id") ?? "").trim()
  const question = requiredText(formData, "question", COPY_LIMITS.faqQuestion, section, "Add the question.")
  const answer = requiredText(formData, "answer", COPY_LIMITS.faqAnswer, section, "Add the answer.")
  if (id) {
    const owned = await prisma.faqEntry.findFirst({ where: { id, siteId: SITE_ID } })
    if (owned) {
      await prisma.faqEntry.update({ where: { id }, data: { question, answer } })
      await finish(section, "Question saved.")
    }
  }
  const total = await prisma.faqEntry.count({ where: { siteId: SITE_ID } })
  await roomFor(section, total, 12)
  await prisma.faqEntry.create({ data: { ...(id ? { id } : {}), siteId: SITE_ID, question, answer, position: total } })
  await finish(section, "Question added.")
}

export async function moveFaq(formData: FormData) {
  const section = "questions"
  await requireManager(contentPath(section))
  const rows = await prisma.faqEntry.findMany({ where: { siteId: SITE_ID }, orderBy: { position: "asc" } })
  const next = swapped(rows, String(formData.get("id") ?? ""), String(formData.get("direction") ?? ""))
  if (!next) return
  await prisma.$transaction(next.map((row, position) => prisma.faqEntry.update({ where: { id: row.id }, data: { position } })))
  await finish(section, "Order saved.")
}

export async function deleteFaq(formData: FormData) {
  const section = "questions"
  await requireManager(contentPath(section))
  await prisma.faqEntry.deleteMany({ where: { id: String(formData.get("id") ?? ""), siteId: SITE_ID } })
  const rows = await prisma.faqEntry.findMany({ where: { siteId: SITE_ID }, orderBy: { position: "asc" } })
  if (rows.length > 0) {
    await prisma.$transaction(rows.map((row, position) => prisma.faqEntry.update({ where: { id: row.id }, data: { position } })))
  }
  await finish(section, "Question removed.")
}
