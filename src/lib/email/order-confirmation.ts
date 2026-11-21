import "server-only"
import { prisma } from "@/lib/prisma"
import { formatDayLabel, formatWindow } from "@/lib/dates"
import { formatNaira } from "@/lib/money"
import { siteUrl } from "@/lib/site"
import { sendEmail } from "@/lib/email/send"

export async function sendOrderConfirmation(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      attendee: true,
      programme: true,
      deliveryPoint: true,
      slots: {
        include: {
          mealSlot: { include: { mealPeriod: true } },
          items: true,
        },
        orderBy: { mealSlot: { date: "asc" } },
      },
    },
  })
  if (!order || order.status !== "PAID") return
  const url = `${siteUrl()}/orders/${order.reference}?token=${order.accessToken}`
  const lines = order.slots.map((slot) => {
    const meals = slot.items.map((item) => `${item.quantity}× ${item.nameSnapshot}`).join(", ")
    const when = `${formatDayLabel(slot.mealSlot.date)} ${slot.mealSlot.mealPeriod.name} (${formatWindow(slot.mealSlot.mealPeriod.deliveryWindowStart, slot.mealSlot.mealPeriod.deliveryWindowEnd)})`
    return `${when}: ${meals}`
  })
  const text = [
    `You're all set, ${order.attendee.fullName}.`,
    `${order.programme.title}`,
    `Reference ${order.reference}`,
    `Collect at ${order.deliveryPoint.name}`,
    ...lines,
    `Total ${formatNaira(order.totalKobo)}`,
    `Meal passes: ${url}`,
  ].join("\n")
  const html = `<p>You're all set, ${escapeHtml(order.attendee.fullName)}.</p>
<p><strong>${escapeHtml(order.programme.title)}</strong><br/>Reference ${escapeHtml(order.reference)}<br/>Collect at ${escapeHtml(order.deliveryPoint.name)}</p>
<ul>${lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
<p>Total ${escapeHtml(formatNaira(order.totalKobo))}</p>
<p><a href="${url}">Open your meal passes</a></p>`
  await sendEmail({
    to: order.attendee.email,
    subject: `Your meals are sorted · ${order.reference}`,
    text,
    html,
  })
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}
