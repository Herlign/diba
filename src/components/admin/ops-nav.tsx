"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Logo } from "@/components/layout/logo"
import { can, type OpsSection, type StaffRoleName } from "@/lib/auth/access"
import { logoutAction } from "@/lib/auth/actions"

const LINKS: { href: string; label: string; section: OpsSection; managerOnly?: boolean }[] = [
  { href: "/admin", label: "Dashboard", section: "overview" },
  { href: "/admin/programmes", label: "Programmes", section: "catalogue" },
  { href: "/admin/menu", label: "Menu", section: "catalogue" },
  { href: "/admin/churches", label: "Churches", section: "catalogue" },
  { href: "/admin/venues", label: "Venues", section: "catalogue" },
  { href: "/admin/content", label: "Website", section: "catalogue", managerOnly: true },
  { href: "/admin/staff", label: "Team", section: "catalogue", managerOnly: true },
  { href: "/admin/plans", label: "Plans", section: "catalogue" },
  { href: "/admin/promos", label: "Promos", section: "catalogue" },
  { href: "/admin/orders", label: "Orders", section: "orders" },
  { href: "/admin/review", label: "Review", section: "orders" },
  { href: "/admin/refunds", label: "Refunds", section: "orders" },
  { href: "/admin/kitchen", label: "Kitchen", section: "kitchen" },
  { href: "/admin/dispatch", label: "Dispatch", section: "dispatch" },
]

export function OpsNav({ role, name }: { role: StaffRoleName; name: string }) {
  const path = usePathname()
  const links = LINKS.filter((link) => can(role, link.section) && (!link.managerOnly || role === "SUPER_ADMIN"))
  return (
    <header className="ops-chrome sticky top-0 z-40 border-b border-border bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        <Logo href="/admin" priority className="h-10 w-auto" />
        <nav className="flex flex-1 flex-wrap gap-1" aria-label="Operations">
          {links.map((link) => {
            const active = path === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex h-10 items-center rounded-lg px-3 text-sm font-semibold ${active ? "bg-palm text-cream" : "text-ink/80"}`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
        <p className="text-sm text-muted-foreground">{name}</p>
        <form action={logoutAction}>
          <button type="submit" className="h-10 text-sm font-semibold text-palm">
            Sign out
          </button>
        </form>
      </div>
    </header>
  )
}
