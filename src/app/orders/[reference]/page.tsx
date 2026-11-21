import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import QRCode from "qrcode"
import { PassActions } from "@/components/ordering/pass-actions"
import { prisma } from "@/lib/prisma"
import { formatDayLabel, formatWindow } from "@/lib/dates"
import { formatNaira } from "@/lib/money"
import { tokensMatch } from "@/lib/secret-match"
import { siteUrl } from "@/lib/site"
import { TrackPurchase } from "@/components/analytics/track-purchase"

export const instant = false

export const metadata: Metadata = {
  title: "Your meals",
  description: "Meal passes for a Diba order.",
}

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ reference: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { reference } = await params
  const { token } = await searchParams
  if (!token) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="font-heading text-4xl">This link needs its token</h1>
        <p className="mt-3 text-sm text-muted-foreground">Open the link from your confirmation email, or ask for a new one from My orders.</p>
        <Link href="/my-orders" className="mt-6 inline-flex h-12 items-center font-semibold text-palm">
          My orders
        </Link>
      </main>
    )
  }
  const order = await prisma.order.findUnique({
    where: { reference },
    include: {
      attendee: true,
      programme: true,
      deliveryPoint: true,
      slots: {
        include: { mealSlot: { include: { mealPeriod: true } }, items: true },
        orderBy: { mealSlot: { date: "asc" } },
      },
    },
  })
  if (!order || !tokensMatch(order.accessToken, token)) notFound()
  const paid = order.status === "PAID" || order.status === "PARTIALLY_FULFILLED" || order.status === "FULFILLED"
  const passes = paid
    ? await Promise.all(
        order.slots
          .filter((slot) => slot.status !== "CANCELLED")
          .map(async (slot) => ({
            name: `${formatDayLabel(slot.mealSlot.date)}-${slot.mealSlot.mealPeriod.name}`.replaceAll(" ", "-"),
            label: `${formatDayLabel(slot.mealSlot.date)} · ${slot.mealSlot.mealPeriod.name}`,
            dataUrl: await QRCode.toDataURL(slot.passToken, { margin: 1, width: 280, errorCorrectionLevel: "M" }),
          })),
      )
    : []
  const pageUrl = `${siteUrl()}/orders/${order.reference}?token=${order.accessToken}`
  const share = `My Diba meals for ${order.programme.title} are sorted. Reference ${order.reference}. ${pageUrl}`

  return (
    <div className="bg-white pb-16 text-ink">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {paid ? <TrackPurchase reference={order.reference} value={order.totalKobo} /> : null}
        <p className="text-sm font-semibold tracking-wide text-palm uppercase">{paid ? "You're all set" : "Order"}</p>
        <h1 className="mt-2 font-heading text-4xl">{order.programme.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {order.reference} · {order.attendee.fullName} · {formatNaira(order.totalKobo)}
        </p>
        {order.needsReview ? (
          <p className="mt-4 rounded-xl bg-[#fff4f2] px-4 py-3 text-sm text-tomato">
            The payment amount did not match this order. The team will review it before anything is prepared.
          </p>
        ) : null}
        {!paid ? (
          <p className="mt-4 rounded-xl bg-[#eef6f1] px-4 py-3 text-sm">
            Payment has not landed yet. Status: {order.status.replaceAll("_", " ").toLowerCase()}.
            {order.status === "PENDING_PAYMENT" ? (
              <>
                {" "}
                <Link className="font-semibold text-palm" href={`/p/${order.programme.slug}/checkout?pay=${order.reference}&token=${order.accessToken}`}>
                  Finish payment
                </Link>
              </>
            ) : null}
          </p>
        ) : (
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Collect at {order.deliveryPoint.name}. Show one pass per meal. On your phone, use the browser menu and choose Add to Home Screen, then open this page at the venue.
          </p>
        )}
        <ol className="mt-6 space-y-4">
          {order.slots.map((slot) => (
            <li key={slot.id} className="rounded-2xl bg-white p-4 ring-1 ring-foreground/10">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-heading text-2xl">{formatDayLabel(slot.mealSlot.date)}</p>
                  <p className="text-sm font-semibold">{slot.mealSlot.mealPeriod.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatWindow(slot.mealSlot.mealPeriod.deliveryWindowStart, slot.mealSlot.mealPeriod.deliveryWindowEnd)} · {order.deliveryPoint.name}
                  </p>
                </div>
                <p className="text-sm font-semibold">{slot.status.replaceAll("_", " ").toLowerCase()}</p>
              </div>
              <ul className="mt-3 text-sm">
                {slot.items.map((item) => (
                  <li key={item.id}>
                    {item.quantity}× {item.nameSnapshot}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
        {passes.length > 0 ? (
          <>
            <h2 className="mt-8 font-heading text-3xl">Meal passes</h2>
            <div className="mt-4 flex gap-4 overflow-x-auto pb-2 snap-x">
              {passes.map((pass) => (
                <figure key={pass.name} className="w-64 shrink-0 snap-start rounded-2xl bg-[#f7f6f3] p-4 text-center">
                  {/* QR codes are generated data URLs, not remote images. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pass.dataUrl} alt={`Meal pass for ${pass.label}`} width={280} height={280} className="mx-auto rounded-lg bg-white" />
                  <figcaption className="mt-2 text-sm font-semibold">{pass.label}</figcaption>
                </figure>
              ))}
            </div>
            <PassActions passes={passes} shareText={share} />
          </>
        ) : null}
        <Link href="/my-orders" className="mt-8 inline-flex h-11 items-center text-sm font-semibold text-palm">
          All my orders
        </Link>
      </div>
    </div>
  )
}
