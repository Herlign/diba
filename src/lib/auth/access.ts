export const STAFF_ROLES = ["SUPER_ADMIN", "CHURCH_ADMIN", "KITCHEN", "DISPATCH"] as const

export type StaffRoleName = (typeof STAFF_ROLES)[number]

export const OPS_SECTIONS = ["overview", "catalogue", "orders", "kitchen", "dispatch"] as const

export type OpsSection = (typeof OPS_SECTIONS)[number]

const ALLOWED: Record<StaffRoleName, readonly OpsSection[]> = {
  SUPER_ADMIN: OPS_SECTIONS,
  CHURCH_ADMIN: OPS_SECTIONS,
  KITCHEN: ["overview", "kitchen"],
  DISPATCH: ["overview", "dispatch"],
}

export function can(role: string | null | undefined, section: OpsSection) {
  if (!role || !isStaffRole(role)) return false
  return ALLOWED[role].includes(section)
}

export function isStaffRole(role: string): role is StaffRoleName {
  return (STAFF_ROLES as readonly string[]).includes(role)
}

export function homeForRole(role: string) {
  if (role === "KITCHEN") return "/admin/kitchen"
  if (role === "DISPATCH") return "/admin/dispatch"
  return "/admin"
}
