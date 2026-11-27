"use client"

import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"

export type SiteChromeCopy = {
  footer: string
  footerNote: string
  footerStaff: string
  footerWhatsapp: string
  whatsappHref: string
  photoCredit: string
  navProgrammes: string
  navOrders: string
  navCta: string
  logoUrl: string | null
  logoAlt: string
}

export function SiteChrome({ children, chrome }: { children: ReactNode; chrome: SiteChromeCopy }) {
  const path = usePathname()
  const ops = path.startsWith("/admin")
  return (
    <>
      {ops ? null : (
        <SiteHeader
          programmes={chrome.navProgrammes}
          orders={chrome.navOrders}
          cta={chrome.navCta}
          logoUrl={chrome.logoUrl}
          logoAlt={chrome.logoAlt}
        />
      )}
      <main id="main" className="flex-1">
        {children}
      </main>
      {ops ? null : (
        <SiteFooter
          footer={chrome.footer}
          footerNote={chrome.footerNote}
          footerStaff={chrome.footerStaff}
          footerWhatsapp={chrome.footerWhatsapp}
          whatsappHref={chrome.whatsappHref}
          photoCredit={chrome.photoCredit}
          logoUrl={chrome.logoUrl}
          logoAlt={chrome.logoAlt}
        />
      )}
    </>
  )
}
