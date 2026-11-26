"use server"

import { prisma } from "@/lib/prisma"
import { noticeTo, requireManager } from "@/lib/admin/guard"
import { revalidatePublic } from "@/lib/admin/revalidate"
import { photoFromForm } from "@/lib/blob-upload"
import { slugify } from "@/lib/slug"

const KNOWN_TAGS = ["spicy", "vegetarian"] as const

function tagsFrom(formData: FormData) {
  const picked = KNOWN_TAGS.filter((tag) => formData.get(`tag-${tag}`) === "on")
  const extra = String(formData.get("tags") ?? "")
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 1 && tag.length <= 30 && !picked.includes(tag as (typeof KNOWN_TAGS)[number]))
  return [...picked, ...extra].slice(0, 8)
}

export async function saveCategory(formData: FormData) {
  await requireManager("/admin/menu")
  const id = String(formData.get("id") ?? "")
  const name = String(formData.get("name") ?? "").trim()
  const slug = slugify(String(formData.get("slug") ?? "") || name)
  if (name.length < 2 || !slug) noticeTo("/admin/menu", "Give the category a name.")
  const clash = await prisma.category.findUnique({ where: { slug } })
  if (clash && clash.id !== id) noticeTo("/admin/menu", "That category link is already used.")
  if (id) {
    const current = await prisma.category.findUnique({ where: { id } })
    if (!current) noticeTo("/admin/menu", "That category was not found.")
    await prisma.category.update({ where: { id }, data: { name, slug } })
  } else {
    const last = await prisma.category.aggregate({ _max: { position: true } })
    await prisma.category.create({
      data: { name, slug, position: (last._max.position ?? -1) + 1, isActive: true },
    })
  }
  revalidatePublic(["/admin/menu"])
  noticeTo("/admin/menu", id ? "Category saved." : "Category added.")
}

export async function moveCategory(formData: FormData) {
  await requireManager("/admin/menu")
  const id = String(formData.get("id") ?? "")
  const direction = String(formData.get("direction") ?? "")
  const categories = await prisma.category.findMany({
    where: { archivedAt: null },
    orderBy: [{ position: "asc" }, { name: "asc" }],
  })
  const index = categories.findIndex((category) => category.id === id)
  const swap = direction === "up" ? index - 1 : index + 1
  if (index < 0 || swap < 0 || swap >= categories.length) return
  const next = [...categories]
  const [moved] = next.splice(index, 1)
  if (!moved) return
  next.splice(swap, 0, moved)
  await prisma.$transaction(
    next.map((category, position) => prisma.category.update({ where: { id: category.id }, data: { position } })),
  )
  revalidatePublic(["/admin/menu"])
}

export async function saveDish(formData: FormData) {
  await requireManager("/admin/menu")
  const id = String(formData.get("id") ?? "")
  const name = String(formData.get("name") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  const categoryId = String(formData.get("categoryId") ?? "")
  const position = Number(formData.get("position") ?? 0)
  const slug = slugify(String(formData.get("slug") ?? "") || name)
  if (name.length < 2) noticeTo("/admin/menu", "Give the dish a name.")
  if (!slug) noticeTo("/admin/menu", "Give the dish a short link.")
  if (description.length > 500) noticeTo("/admin/menu", "Keep the description under 500 characters.")
  const category = await prisma.category.findUnique({ where: { id: categoryId } })
  if (!category) noticeTo("/admin/menu", "Choose a category.")
  const clash = await prisma.menuItem.findUnique({ where: { slug } })
  if (clash && clash.id !== id) noticeTo("/admin/menu", "That link is already used. Change the short link.")
  const dietaryTags = tagsFrom(formData)
  const photo = await photoFromForm(formData, `menu/${slug}`, String(formData.get("currentImage") ?? ""))
  if (!photo.ok) noticeTo(id ? `/admin/menu#dish-${id}` : "/admin/menu", photo.error)

  if (id) {
    const current = await prisma.menuItem.findUnique({ where: { id } })
    if (!current) noticeTo("/admin/menu", "That dish was not found.")
    await prisma.menuItem.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        categoryId,
        dietaryTags,
        position: Number.isFinite(position) ? Math.max(0, Math.round(position)) : current.position,
        imageUrl: photo.url || current.imageUrl,
      },
    })
    revalidatePublic(["/admin/menu"])
    noticeTo(`/admin/menu#dish-${id}`, `Saved ${name}.${photo.notice}`)
  }

  const naira = Number(formData.get("naira") ?? 0)
  if (!Number.isFinite(naira) || naira < 0 || naira > 1_000_000) noticeTo("/admin/menu", "Enter a price in naira.")
  const created = await prisma.menuItem.create({
    data: {
      name,
      slug,
      description,
      categoryId,
      dietaryTags,
      position: Number.isFinite(position) ? Math.max(0, Math.round(position)) : 0,
      imageUrl: photo.url || "/images/jollof.jpg",
      isActive: true,
      variants: {
        create: {
          name: "Regular",
          priceKobo: Math.round(naira * 100),
          position: 0,
          isAvailable: true,
        },
      },
    },
  })
  revalidatePublic(["/admin/menu"])
  const standIn = photo.url ? "" : " It is using a stand-in photo until you upload one."
  noticeTo(`/admin/menu#dish-${created.id}`, `Added ${name}.${photo.notice}${standIn}`)
}

export async function restoreDish(formData: FormData) {
  await requireManager("/admin/menu")
  const id = String(formData.get("id") ?? "")
  const item = await prisma.menuItem.findUnique({ where: { id }, include: { category: true } })
  if (!item) noticeTo("/admin/menu", "That dish was not found.")
  await prisma.menuItem.update({ where: { id }, data: { isActive: true, archivedAt: null } })
  if (item.category.archivedAt || !item.category.isActive) {
    await prisma.category.update({
      where: { id: item.categoryId },
      data: { isActive: true, archivedAt: null },
    })
  }
  revalidatePublic(["/admin/menu"])
  noticeTo(`/admin/menu#dish-${id}`, `${item.name} is back on the menu.`)
}
