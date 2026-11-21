import { notFound, redirect } from "next/navigation"

export const instant = false
import { prisma } from "@/lib/prisma"

export default async function ProgrammeCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const programme = await prisma.programme.findFirst({
    where: { code: { equals: code, mode: "insensitive" } },
    select: { slug: true, status: true },
  })
  if (!programme || programme.status === "DRAFT" || programme.status === "ARCHIVED") notFound()
  redirect(`/p/${programme.slug}`)
}
