"use server"

import { redirect } from "next/navigation"
import { homeForRole } from "@/lib/auth/access"
import { endStaffSession, startStaffSession } from "@/lib/auth/session"
import { rateLimit } from "@/lib/rate-limit"

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "")
  const password = String(formData.get("password") ?? "")
  if (!rateLimit(`staff-login:${email.toLowerCase()}`, 8, 10 * 60 * 1000)) {
    redirect("/admin/login?error=rate")
  }
  const result = await startStaffSession(email, password)
  if (!result.ok) redirect("/admin/login?error=1")
  redirect(homeForRole(result.role))
}

export async function logoutAction() {
  await endStaffSession()
  redirect("/admin/login")
}
