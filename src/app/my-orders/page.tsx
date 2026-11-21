import type { Metadata } from "next"
import { MagicLinkRequest } from "@/components/ordering/magic-link-request"
import { MyOrdersList } from "@/components/ordering/my-orders-list"
import { ordersForMagicLink } from "@/lib/orders/actions"

export const instant = false

export const metadata: Metadata = {
  title: "My orders",
  description: "Open the meals you already booked.",
}

export default async function MyOrdersPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams
  if (!token) return <MagicLinkRequest />
  const result = await ordersForMagicLink(token)
  if (!result.ok) return <MagicLinkRequest error={result.error} />
  return <MyOrdersList email={result.email} orders={result.orders} />
}
