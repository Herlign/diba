import { prisma } from "@/lib/prisma"
import { getStaff } from "@/lib/auth/session"
import { can } from "@/lib/auth/access"
import { csvRow } from "@/lib/admin/csv"

export async function GET(request: Request) {
  const staff = await getStaff()
  if (!staff || !can(staff.role, "orders")) return new Response("Unauthorized", { status: 401 })
  const url = new URL(request.url)
  const q = url.searchParams.get("q")
  const programme = url.searchParams.get("programme")
  const status = url.searchParams.get("status")
  const point = url.searchParams.get("point")
  const orders = await prisma.order.findMany({
    where: {
      programmeId: programme || undefined,
      status: status ? (status as "PAID") : undefined,
      deliveryPointId: point || undefined,
      OR: q
        ? [
            { reference: { contains: q, mode: "insensitive" } },
            { attendee: { fullName: { contains: q, mode: "insensitive" } } },
            { attendee: { email: { contains: q, mode: "insensitive" } } },
          ]
        : undefined,
    },
    include: { attendee: true, programme: true, deliveryPoint: true },
    orderBy: { createdAt: "desc" },
  })
  const lines = [
    csvRow(["reference", "status", "programme", "name", "phone", "email", "delivery point", "people", "total naira", "needs review"]),
    ...orders.map((order) =>
      csvRow([
        order.reference,
        order.status,
        order.programme.title,
        order.attendee.fullName,
        order.attendee.phone,
        order.attendee.email,
        order.deliveryPoint.name,
        order.numberOfPeople,
        Math.round(order.totalKobo / 100),
        order.needsReview ? "yes" : "no",
      ]),
    ),
  ]
  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=diba-orders.csv",
    },
  })
}
