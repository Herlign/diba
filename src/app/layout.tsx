import type { Metadata } from "next"
import { Fraunces, Outfit } from "next/font/google"
import { AnalyticsScripts } from "@/components/analytics/scripts"
import { SiteChrome } from "@/components/layout/site-chrome"
import { MARKETING } from "@/lib/catalogue"
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

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Diba Meals",
    template: "%s · Diba Meals",
  },
  description: `${MARKETING.headlineLead} ${MARKETING.headlineRest}. ${MARKETING.footer}`,
  openGraph: {
    title: "Diba Meals",
    description: `${MARKETING.headlineLead} ${MARKETING.headlineRest}. Morning, afternoon and evening, delivered at the programme venue.`,
    locale: "en_NG",
    type: "website",
    url: siteUrl,
  },
  twitter: {
    card: "summary",
    title: "Diba Meals",
    description: `${MARKETING.headlineLead} ${MARKETING.headlineRest}. Morning, afternoon and evening, delivered at the programme venue.`,
  },
}

export default function RootLayout({ children }: LayoutProps<"/">) {
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
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  )
}
