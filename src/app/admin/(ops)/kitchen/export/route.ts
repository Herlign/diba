import { prisma } from "@/lib/prisma"
import { getStaff } from "@/lib/auth/session"
import { can } from "@/lib/auth/access"
import { csvRow } from "@/lib/admin/csv"
import { prepSheet } from "@/lib/kitchen/prep"
import { orderLineLabel } from "@/lib/ordering/line-label"
import { formatDayLabel } from "@/lib/dates"

const PAID = ["PAID", "PARTIALLY_FULFILLED", "FULFILLED"] as const

export async function GET(request: Request) {
  const staff = await getStaff()
  if (!staff || !can(staff.role, "kitchen")) return new Response("Unauthorized", { status: 401 })
  const slotId = new URL(request.url).searchParams.get("slot")
  if (!slotId) return new Response("Missing slot", { status: 400 })
  const slot = await prisma.mealSlot.findUnique({
    where: { id: slotId },
    include: { mealPeriod: true, programme: true },
  })
  if (!slot) return new Response("Missing slot", { status: 404 })
  const rows = await prisma.orderSlot.findMany({
    where: { mealSlotId: slot.id, order: { status: { in: [...PAID] } } },
    include: { items: true, order: { include: { attendee: true } } },
  })
  const sheet = prepSheet(
    rows.map((row) => ({
      slotStatus: row.status,
      attendee: row.order.attendee.fullName,
      notes: row.order.dietaryNotes,
      items: row.items.map((item) => ({ name: orderLineLabel(item), quantity: item.quantity })),
    })),
  )
  const lines = [
    csvRow([slot.programme.title, formatDayLabel(slot.date), slot.mealPeriod.name]),
    csvRow(["plate", "count"]),
    ...sheet.lines.map((line) => csvRow([line.name, line.quantity])),
    csvRow([]),
    csvRow(["attendee", "notes"]),
    ...sheet.notes.map((note) => csvRow([note.attendee, note.notes])),
  ]
  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=diba-prep.csv",
    },
  })
}
