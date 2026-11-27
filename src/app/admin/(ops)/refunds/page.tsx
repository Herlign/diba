import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { requireSection } from "@/lib/admin/require"
import { decideRefund } from "@/lib/admin/mutations"

export const instant = false

export const metadata = { title: "Refund requests" }

export default async function RefundsPage() {
  await requireSection("orders")
  const requests = await prisma.refundRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { order: true, orderSlot: { include: { mealSlot: { include: { mealPeriod: true } } } } },
  })
  return (
    <div>
      <h1 className="font-heading text-4xl">Refund requests</h1>
      <p className="mt-2 text-sm text-muted-foreground">Approving a request does not send money back. Mark the order refunded when the church has paid it.</p>
      <ul className="mt-4 space-y-3">
        {requests.map((request) => (
          <li key={request.id} className="rounded-2xl bg-white p-4 ring-1 ring-foreground/10">
            <p className="font-semibold">
              <Link href={`/admin/orders/${request.order.reference}`} className="text-palm">
                {request.order.reference}
              </Link>{" "}
              · {request.status.toLowerCase()}
            </p>
            <p className="text-sm text-muted-foreground">{request.note}</p>
            {request.status === "REQUESTED" ? (
              <form action={decideRefund} className="mt-3 flex flex-wrap gap-2">
                <input type="hidden" name="id" value={request.id} />
                <input name="note" placeholder="Note for the church" className="h-11 flex-1 rounded-lg border border-border px-3" />
                <button name="status" value="APPROVED" className="h-11 rounded-lg bg-palm px-3 text-sm font-semibold text-cream">
                  Approve
                </button>
                <button name="status" value="REJECTED" className="h-11 rounded-lg border border-border px-3 text-sm font-semibold">
                  Reject
                </button>
              </form>
            ) : null}
          </li>
        ))}
        {requests.length === 0 ? <li className="text-sm text-muted-foreground">No refund requests yet.</li> : null}
      </ul>
    </div>
  )
}
