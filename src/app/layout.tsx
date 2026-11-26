import type { ReactNode } from "react"
import type { Metadata } from "next"
import { Fraunces, Outfit } from "next/font/google"
import { AnalyticsScripts } from "@/components/analytics/scripts"
import { SiteChrome } from "@/components/layout/site-chrome"
import { getSiteContent } from "@/lib/site-content"
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

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent()
  const description = `${content.headlineLead} ${content.headlineRest}. ${content.footer}`
  const social = `${content.headlineLead} ${content.headlineRest}. Morning, afternoon and evening, delivered at the programme venue.`
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: "Diba Meals",
      template: "%s · Diba Meals",
    },
    description,
    openGraph: {
      title: "Diba Meals",
      description: social,
      locale: "en_NG",
      type: "website",
      url: siteUrl,
    },
    twitter: {
      card: "summary",
      title: "Diba Meals",
      description: social,
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
        <SiteChrome footer={content.footer}>{children}</SiteChrome>
      </body>
    </html>
  )
}
