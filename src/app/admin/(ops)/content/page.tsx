import { redirect } from "next/navigation"
import { WebsiteEditor } from "@/components/admin/website-editor"
import { requireSection } from "@/lib/admin/require"
import { blobReady } from "@/lib/blob-upload"
import { prisma } from "@/lib/prisma"
import { SITE_ID } from "@/lib/site-copy"
import { fallbackCopy, siteContentInclude, toSiteCopy } from "@/lib/site-content"

export const instant = false

export const metadata = { title: "Website" }

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string; section?: string }>
}) {
  const staff = await requireSection("catalogue")
  if (staff.role !== "SUPER_ADMIN") redirect("/admin")
  const { notice, error, section } = await searchParams
  const row = await prisma.siteContent.findUnique({
    where: { id: SITE_ID },
    include: siteContentInclude,
  })
  return (
    <WebsiteEditor
      copy={row ? toSiteCopy(row) : fallbackCopy()}
      uploads={blobReady()}
      notice={notice}
      error={error}
      section={section}
    />
  )
}
