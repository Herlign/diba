import type { Metadata } from "next"
import { MagicLinkRequest } from "@/components/ordering/magic-link-request"
import { MyOrdersList } from "@/components/ordering/my-orders-list"
import { ordersForMagicLink } from "@/lib/orders/actions"
import { getSiteContent } from "@/lib/site-content"

export const instant = false

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent()
  return {
    title: content.ordersEyebrow,
    description: content.ordersBody,
  }
}

export default async function MyOrdersPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams
  const content = await getSiteContent()
  const copy = {
    eyebrow: content.ordersEyebrow,
    title: content.ordersTitle,
    body: content.ordersBody,
    emailLabel: content.ordersEmailLabel,
    button: content.ordersButton,
    sending: content.ordersSending,
  }
  if (!token) return <MagicLinkRequest {...copy} />
  const result = await ordersForMagicLink(token)
  if (!result.ok) return <MagicLinkRequest {...copy} error={result.error} />
  return <MyOrdersList email={result.email} orders={result.orders} />
}
