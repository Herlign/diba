import type { Metadata } from "next"

export const instant = false
import { notFound } from "next/navigation"
import { ReviewExperience } from "@/components/ordering/review-experience"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = {
  title: "Review",
  description: "Check the days, meals and prices before you pay.",
}

export default async function ReviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const programme = await prisma.programme.findUnique({
    where: { slug },
    select: { id: true, title: true, status: true },
  })
  if (!programme || programme.status === "DRAFT" || programme.status === "ARCHIVED") notFound()
  return <ReviewExperience programmeId={programme.id} slug={slug} title={programme.title} />
}
