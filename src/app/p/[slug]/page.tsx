import type { Metadata } from "next"

export const instant = false
import { notFound } from "next/navigation"
import { OrderingExperience } from "@/components/ordering/ordering-experience"
import { loadOrderingProgramme } from "@/lib/ordering/load-programme"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const programme = await loadOrderingProgramme(slug)
  if (!programme) return { title: "Programme" }
  const description = `${programme.churchName} · ${programme.venueName}. ${programme.description}`
  return {
    title: programme.title,
    description,
    openGraph: {
      title: `${programme.title} · ${programme.churchName}`,
      description,
    },
  }
}

export default async function ProgrammeOrderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const programme = await loadOrderingProgramme(slug)
  if (!programme) notFound()
  return <OrderingExperience programme={programme} />
}
