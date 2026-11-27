import "server-only"

import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { failTo, noticeTo } from "@/lib/admin/guard"
import { revalidateContent } from "@/lib/admin/revalidate"
import { photoFromForm } from "@/lib/blob-upload"
import { ensureSiteContent } from "@/lib/ensure-site-content"
import { SITE_ID } from "@/lib/site-copy"
import { contentPath, nextImageUrl } from "@/lib/site-text"

export function requiredText(formData: FormData, name: string, max: number, section: string, empty: string) {
  const value = String(formData.get(name) ?? "").trim()
  if (!value) failTo(contentPath(section), empty)
  if (value.length > max) failTo(contentPath(section), "That line is too long. Shorten it.")
  return value
}

export function optionalText(formData: FormData, name: string, max: number, section: string) {
  const value = String(formData.get(name) ?? "").trim()
  if (value.length > max) failTo(contentPath(section), "That line is too long. Shorten it.")
  return value
}

export async function writeSite(section: string, data: Prisma.SiteContentUpdateInput, notice: string) {
  const existing = await prisma.siteContent.findUnique({ where: { id: SITE_ID } })
  if (!existing) await ensureSiteContent(prisma)
  await prisma.siteContent.update({ where: { id: SITE_ID }, data })
  revalidateContent()
  noticeTo(contentPath(section), notice)
}

type ImageFields = { file?: string; current?: string; remove?: string }

/** Keeps, replaces, or restores a photo. A chosen file is uploaded with put() when storage is set up. */
export async function storedImage(formData: FormData, prefix: string, section: string, fallback: string, fields?: ImageFields) {
  const fileKey = fields?.file ?? "photo"
  const currentKey = fields?.current ?? "currentImage"
  const removeKey = fields?.remove ?? "removePhoto"
  const current = String(formData.get(currentKey) ?? "")
  const scoped = new FormData()
  const file = formData.get(fileKey)
  if (file instanceof File) scoped.set("photo", file)
  const photo = await photoFromForm(scoped, prefix, current)
  if (!photo.ok) failTo(contentPath(section), photo.error)
  const url = nextImageUrl({
    current,
    uploaded: photo.url !== current ? photo.url : null,
    remove: formData.get(removeKey) === "1" && !photo.notice,
    fallback,
  })
  return { url, notice: photo.notice }
}

export async function roomFor(section: string, total: number, max: number) {
  if (total >= max) failTo(contentPath(section), "That is enough items. Remove one before adding another.")
}
