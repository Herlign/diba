import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { CheckoutExperience } from "@/components/ordering/checkout-experience"
import { getPaymentSheet } from "@/lib/checkout/actions"
import { prisma } from "@/lib/prisma"

export const instant = false

export const metadata: Metadata = {
  title: "Checkout",
  description: "Tell us who the meals are for, then pay.",
}

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ pay?: string; token?: string }>
}) {
  const { slug } = await params
  const { pay, token } = await searchParams
  const programme = await prisma.programme.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      status: true,
      orderCutoffHours: true,
      venue: {
        select: {
          deliveryPoints: {
            where: { isActive: true },
            orderBy: { position: "asc" },
            select: { id: true, name: true, description: true },
          },
        },
      },
    },
  })
  if (!programme || programme.status === "DRAFT" || programme.status === "ARCHIVED") notFound()
  const sheet = pay && token ? await getPaymentSheet(pay, token) : null
  if (sheet?.ok && (sheet.status === "PAID" || sheet.status === "PARTIALLY_FULFILLED" || sheet.status === "FULFILLED")) {
    redirect(sheet.href)
  }
  return (
    <CheckoutExperience
      programme={{
        id: programme.id,
        slug,
        title: programme.title,
        cutoffHours: programme.orderCutoffHours,
        deliveryPoints: programme.venue.deliveryPoints,
      }}
      sheet={sheet?.ok && sheet.status === "PENDING_PAYMENT" ? sheet : null}
    />
  )
}
