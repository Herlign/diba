import "server-only"
import { cookies } from "next/headers"
import { connection } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { isStaffRole, type StaffRoleName } from "@/lib/auth/access"
import { readStaffSession, signStaffSession, type StaffSession } from "@/lib/auth/token"

const COOKIE = "diba_staff"
const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000

function secret() {
  return process.env.AUTH_SECRET || ""
}

export async function getStaff(): Promise<StaffSession | null> {
  await connection()
  const key = secret()
  if (!key) return null
  const token = (await cookies()).get(COOKIE)?.value
  if (!token) return null
  const session = readStaffSession(token, key)
  if (!session || !isStaffRole(session.role)) return null
  const user = await prisma.staffUser.findUnique({
    where: { id: session.id },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  })
  if (!user || !user.isActive || !isStaffRole(user.role)) return null
  return { id: user.id, email: user.email, name: user.name, role: user.role, exp: session.exp }
}

export async function startStaffSession(email: string, password: string) {
  const key = secret()
  if (!key) return { ok: false as const, error: "Staff sign-in is not configured." }
  const user = await prisma.staffUser.findUnique({ where: { email: email.trim().toLowerCase() } })
  if (!user || !user.isActive || !isStaffRole(user.role)) {
    return { ok: false as const, error: "Those details don't match a staff account." }
  }
  const match = await bcrypt.compare(password, user.passwordHash)
  if (!match) return { ok: false as const, error: "Those details don't match a staff account." }
  const session: StaffSession = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as StaffRoleName,
    exp: Date.now() + TWELVE_HOURS_MS,
  }
  const jar = await cookies()
  jar.set(COOKIE, signStaffSession(session, key), {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: TWELVE_HOURS_MS / 1000,
  })
  return { ok: true as const, role: session.role }
}

export async function endStaffSession() {
  const jar = await cookies()
  jar.delete(COOKIE)
}
