"use server"

import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { noticeTo, requireManager } from "@/lib/admin/guard"

const ROLES = ["SUPER_ADMIN", "CHURCH_ADMIN", "KITCHEN", "DISPATCH"] as const

type Role = (typeof ROLES)[number]

function roleOf(value: string): Role | null {
  return ROLES.includes(value as Role) ? (value as Role) : null
}

async function otherManagers(exceptId: string) {
  return prisma.staffUser.count({
    where: { role: "SUPER_ADMIN", isActive: true, NOT: { id: exceptId } },
  })
}

export async function addStaff(formData: FormData) {
  await requireManager("/admin/staff")
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const name = String(formData.get("name") ?? "").trim()
  const role = roleOf(String(formData.get("role") ?? ""))
  const password = String(formData.get("password") ?? "")
  if (name.length < 2) noticeTo("/admin/staff", "Enter their name.")
  if (!email.includes("@") || email.length > 120) noticeTo("/admin/staff", "Enter a real email address.")
  if (!role) noticeTo("/admin/staff", "Choose a role.")
  if (password.length < 8) noticeTo("/admin/staff", "Use at least 8 characters for the password.")
  const existing = await prisma.staffUser.findUnique({ where: { email } })
  if (existing) noticeTo("/admin/staff", "That email is already on the team. Reset their password below.")
  await prisma.staffUser.create({
    data: { email, name, role, passwordHash: bcrypt.hashSync(password, 10), isActive: true },
  })
  revalidatePath("/admin/staff")
  noticeTo("/admin/staff", `${name} can sign in with that password.`)
}

export async function saveStaff(formData: FormData) {
  const manager = await requireManager("/admin/staff")
  const id = String(formData.get("id") ?? "")
  const name = String(formData.get("name") ?? "").trim()
  const role = roleOf(String(formData.get("role") ?? ""))
  if (name.length < 2) noticeTo("/admin/staff", "Enter their name.")
  if (!role) noticeTo("/admin/staff", "Choose a role.")
  const current = await prisma.staffUser.findUnique({ where: { id } })
  if (!current) noticeTo("/admin/staff", "That person was not found.")
  if (current.role === "SUPER_ADMIN" && role !== "SUPER_ADMIN") {
    if (id === manager.id) noticeTo("/admin/staff", "You can't change your own role.")
    if ((await otherManagers(id)) === 0) noticeTo("/admin/staff", "Keep at least one manager account.")
  }
  await prisma.staffUser.update({ where: { id }, data: { name, role } })
  revalidatePath("/admin", "layout")
  noticeTo("/admin/staff", "Saved.")
}

export async function resetStaffPassword(formData: FormData) {
  await requireManager("/admin/staff")
  const id = String(formData.get("id") ?? "")
  const password = String(formData.get("password") ?? "")
  if (password.length < 8) noticeTo("/admin/staff", "Use at least 8 characters for the password.")
  const current = await prisma.staffUser.findUnique({ where: { id } })
  if (!current) noticeTo("/admin/staff", "That person was not found.")
  await prisma.staffUser.update({ where: { id }, data: { passwordHash: bcrypt.hashSync(password, 10) } })
  revalidatePath("/admin/staff")
  noticeTo("/admin/staff", `Password updated for ${current.name}. They stay signed in until that session ends.`)
}

export async function setStaffActive(formData: FormData) {
  const manager = await requireManager("/admin/staff")
  const id = String(formData.get("id") ?? "")
  const active = String(formData.get("active") ?? "") === "true"
  const current = await prisma.staffUser.findUnique({ where: { id } })
  if (!current) noticeTo("/admin/staff", "That person was not found.")
  if (!active && id === manager.id) noticeTo("/admin/staff", "You can't turn off your own account.")
  if (!active && current.role === "SUPER_ADMIN" && (await otherManagers(id)) === 0) {
    noticeTo("/admin/staff", "Keep at least one manager account.")
  }
  await prisma.staffUser.update({ where: { id }, data: { isActive: active } })
  revalidatePath("/admin", "layout")
  noticeTo("/admin/staff", active ? `${current.name} can sign in again.` : `${current.name} can no longer sign in.`)
}
