import { redirect } from "next/navigation"
import { getStaff } from "@/lib/auth/session"

export function noticeTo(path: string, notice: string, tone: "ok" | "error" = "ok"): never {
  const hashAt = path.indexOf("#")
  const hash = hashAt >= 0 ? path.slice(hashAt) : ""
  const base = hashAt >= 0 ? path.slice(0, hashAt) : path
  const join = base.includes("?") ? "&" : "?"
  const flag = tone === "error" ? "&error=1" : ""
  redirect(`${base}${join}notice=${encodeURIComponent(notice)}${flag}${hash}`)
}

export function failTo(path: string, notice: string): never {
  noticeTo(path, notice, "error")
}

/** Content changes are limited to the manager account. */
export async function requireManager(path = "/admin") {
  const staff = await getStaff()
  if (!staff) redirect("/admin/login")
  if (staff.role !== "SUPER_ADMIN") failTo(path, "Only the manager can save changes.")
  return staff
}
