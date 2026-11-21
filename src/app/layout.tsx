import type { Metadata } from "next"
import { Fraunces, Outfit } from "next/font/google"
import { SiteChrome } from "@/components/layout/site-chrome"
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
  description:
    "Your meals, sorted for the whole church programme. Pick your days, choose morning and evening plates, and we deliver them at the venue.",
  openGraph: {
    title: "Diba Meals",
    description:
      "Meal pre-orders for multi-day church programmes in Lagos. Morning and evening, delivered where you sit.",
    locale: "en_NG",
    type: "website",
    url: siteUrl,
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
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  )
}
