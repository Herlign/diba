import "server-only"
import { redirect } from "next/navigation"
import { can, type OpsSection } from "@/lib/auth/access"
import { getStaff } from "@/lib/auth/session"

export async function requireSection(section: OpsSection) {
  const staff = await getStaff()
  if (!staff) redirect("/admin/login")
  if (!can(staff.role, section)) redirect("/admin")
  return staff
}
