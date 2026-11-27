import type { ReactNode } from "react"
import type { Metadata } from "next"
import { Fraunces, Outfit } from "next/font/google"
import { AnalyticsScripts } from "@/components/analytics/scripts"
import { SiteChrome, type SiteChromeCopy } from "@/components/layout/site-chrome"
import { getSiteContent, type SiteCopy } from "@/lib/site-content"
import { joinParts } from "@/lib/site-text"
import "./globals.css"

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
})

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:4317"

function chromeFrom(content: SiteCopy): SiteChromeCopy {
  return {
    footer: content.footer,
    footerNote: content.footerNote,
    footerStaff: content.footerStaff,
    footerWhatsapp: content.footerWhatsapp,
    whatsappHref: `https://wa.me/${content.whatsappNumber}`,
    photoCredit: content.photoCredit,
    navProgrammes: content.navProgrammes,
    navOrders: content.navOrders,
    navCta: content.navCta,
    logoUrl: content.logoUrl,
    logoAlt: content.logoAlt,
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent()
  const description = joinParts([content.headlineLead, content.headlineRest, content.footer])
  const social = joinParts([content.headlineLead, content.headlineRest, content.socialExtra])
  const shareImage = content.ogImageUrl ? [{ url: content.ogImageUrl, alt: content.ogImageAlt }] : undefined
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: content.siteName,
      template: `%s · ${content.siteName}`,
    },
    description,
    ...(content.faviconUrl ? { icons: { icon: content.faviconUrl, apple: content.faviconUrl } } : {}),
    openGraph: {
      title: content.siteName,
      description: social,
      locale: "en_NG",
      type: "website",
      url: siteUrl,
      ...(shareImage ? { images: shareImage } : {}),
    },
    twitter: {
      card: content.ogImageUrl ? "summary_large_image" : "summary",
      title: content.siteName,
      description: social,
      ...(content.ogImageUrl ? { images: [content.ogImageUrl] } : {}),
    },
  }
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const content = await getSiteContent()
  return (
    <html
      lang="en-NG"
      className={`${outfit.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2"
        >
          Skip to content
        </a>
        <AnalyticsScripts gtmId={process.env.NEXT_PUBLIC_GTM_ID} pixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID} />
        <SiteChrome chrome={chromeFrom(content)}>{children}</SiteChrome>
      </body>
    </html>
  )
}
