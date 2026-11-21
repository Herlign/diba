"use client"

import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"

export function SiteChrome({ children }: { children: ReactNode }) {
  const path = usePathname()
  const ops = path.startsWith("/admin")
  return (
    <>
      {ops ? null : <SiteHeader />}
      <main id="main" className="flex-1">
        {children}
      </main>
      {ops ? null : <SiteFooter />}
    </>
  )
}
