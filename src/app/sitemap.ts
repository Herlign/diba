import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:4317"
  return [
    { url: siteUrl, lastModified: new Date() },
    { url: `${siteUrl}/programmes`, lastModified: new Date() },
  ]
}
