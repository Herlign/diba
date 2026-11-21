import type { MetadataRoute } from "next"
import { prisma } from "@/lib/prisma"
import { siteUrl } from "@/lib/site"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteUrl()
  const pages: MetadataRoute.Sitemap = [
    { url: origin, lastModified: new Date() },
    { url: `${origin}/programmes`, lastModified: new Date() },
    { url: `${origin}/my-orders`, lastModified: new Date() },
  ]
  try {
    const programmes = await prisma.programme.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
    })
    for (const programme of programmes) {
      pages.push({ url: `${origin}/p/${programme.slug}`, lastModified: programme.updatedAt })
    }
  } catch {
    return pages
  }
  return pages
}