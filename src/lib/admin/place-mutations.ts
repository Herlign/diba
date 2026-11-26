"use server"

import { prisma } from "@/lib/prisma"
import { noticeTo, requireManager } from "@/lib/admin/guard"
import { revalidatePublic } from "@/lib/admin/revalidate"
import { photoFromForm } from "@/lib/blob-upload"
import { slugify } from "@/lib/slug"

export async function saveChurch(formData: FormData) {
  await requireManager("/admin/churches")
  const id = String(formData.get("id") ?? "")
  const name = String(formData.get("name") ?? "").trim()
  const slug = slugify(String(formData.get("slug") ?? "") || name)
  const contactPhone = String(formData.get("contactPhone") ?? "").trim()
  const contactEmail = String(formData.get("contactEmail") ?? "").trim().toLowerCase()
  const isActive = formData.get("isActive") === "on"
  if (name.length < 2 || !slug) noticeTo("/admin/churches", "Give the church a name.")
  if (contactPhone.replace(/\D/g, "").length < 7) noticeTo("/admin/churches", "Enter a phone number.")
  if (!contactEmail.includes("@")) noticeTo("/admin/churches", "Enter an email address.")
  const clash = await prisma.church.findUnique({ where: { slug } })
  if (clash && clash.id !== id) noticeTo("/admin/churches", "That link is already used.")
  const photo = await photoFromForm(formData, `churches/${slug}`, String(formData.get("currentImage") ?? ""))
  if (!photo.ok) noticeTo(id ? `/admin/churches#church-${id}` : "/admin/churches", photo.error)
  const data = {
    name,
    slug,
    contactPhone,
    contactEmail,
    isActive,
    archivedAt: isActive ? null : new Date(),
    logoUrl: photo.url || null,
  }
  if (id) {
    const current = await prisma.church.findUnique({ where: { id } })
    if (!current) noticeTo("/admin/churches", "That church was not found.")
    if (!photo.url) data.logoUrl = current.logoUrl
    if (isActive) data.archivedAt = null
    else data.archivedAt = current.archivedAt ?? new Date()
    await prisma.church.update({ where: { id }, data })
  } else {
    await prisma.church.create({ data })
  }
  revalidatePublic(["/admin/churches"])
  noticeTo("/admin/churches", `${name} saved.${photo.notice}`)
}

export async function saveVenue(formData: FormData) {
  await requireManager("/admin/venues")
  const id = String(formData.get("id") ?? "")
  const name = String(formData.get("name") ?? "").trim()
  const address = String(formData.get("address") ?? "").trim()
  const notes = String(formData.get("notes") ?? "").trim()
  const available = formData.get("available") === "on"
  if (name.length < 2) noticeTo("/admin/venues", "Give the venue a name.")
  if (address.length < 5) noticeTo("/admin/venues", "Enter the address.")
  const pointName = String(formData.get("pointName") ?? "").trim()
  const pointDescription = String(formData.get("pointDescription") ?? "").trim()
  if (id) {
    const current = await prisma.venue.findUnique({ where: { id } })
    if (!current) noticeTo("/admin/venues", "That venue was not found.")
    await prisma.venue.update({
      where: { id },
      data: { name, address, notes, archivedAt: available ? null : current.archivedAt ?? new Date() },
    })
    revalidatePublic(["/admin/venues"])
    noticeTo(`/admin/venues#venue-${id}`, `${name} saved.`)
  }
  const venue = await prisma.venue.create({
    data: {
      name,
      address,
      notes,
      archivedAt: available ? null : new Date(),
      ...(pointName.length >= 2
        ? { deliveryPoints: { create: { name: pointName, description: pointDescription, position: 0 } } }
        : {}),
    },
  })
  revalidatePublic(["/admin/venues"])
  const extra = pointName.length >= 2 ? "" : " Add a collection point before people can check out."
  noticeTo(`/admin/venues#venue-${venue.id}`, `${name} added.${extra}`)
}

export async function savePoint(formData: FormData) {
  await requireManager("/admin/venues")
  const id = String(formData.get("id") ?? "")
  const name = String(formData.get("name") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  if (name.length < 2) noticeTo("/admin/venues", "Give the collection point a name.")
  const point = await prisma.deliveryPoint.findUnique({ where: { id } })
  if (!point) noticeTo("/admin/venues", "That collection point was not found.")
  await prisma.deliveryPoint.update({ where: { id }, data: { name, description } })
  revalidatePublic(["/admin/venues", "/admin/points"])
  noticeTo(`/admin/venues#venue-${point.venueId}`, "Collection point saved.")
}

export async function createPoint(formData: FormData) {
  await requireManager("/admin/venues")
  const venueId = String(formData.get("venueId") ?? "")
  const name = String(formData.get("name") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  if (!venueId || name.length < 2) noticeTo("/admin/venues", "Give the collection point a name.")
  const venue = await prisma.venue.findUnique({ where: { id: venueId } })
  if (!venue) noticeTo("/admin/venues", "That venue was not found.")
  const count = await prisma.deliveryPoint.count({ where: { venueId } })
  await prisma.deliveryPoint.create({ data: { venueId, name, description, position: count } })
  revalidatePublic(["/admin/venues"])
  noticeTo(`/admin/venues#venue-${venueId}`, "Collection point added.")
}

export async function togglePoint(formData: FormData) {
  await requireManager("/admin/venues")
  const id = String(formData.get("id") ?? "")
  const point = await prisma.deliveryPoint.findUnique({ where: { id } })
  if (!point) noticeTo("/admin/venues", "That collection point was not found.")
  await prisma.deliveryPoint.update({ where: { id }, data: { isActive: !point.isActive } })
  revalidatePublic(["/admin/venues"])
  noticeTo(`/admin/venues#venue-${point.venueId}`, point.isActive ? "Collection point hidden." : "Collection point shown.")
}
