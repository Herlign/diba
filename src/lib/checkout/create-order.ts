import "server-only"
import { randomBytes } from "node:crypto"
import { Prisma } from "@prisma/client"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { formatDayLabel } from "@/lib/dates"
import { normaliseNigerianPhone } from "@/lib/phone"
import { deliveryStartFromKey, lagosDateKey, PENDING_HOLD_MS, type PlanRule, type SlotState } from "@/lib/ordering/rules"
import { checkoutSlotState } from "@/lib/checkout/capacity"
import { priceCheckout, type CheckoutSlot } from "@/lib/checkout/price"
import { signPassToken } from "@/lib/passes/token"
import { paymentsMode, siteUrl } from "@/lib/site"
import { initialisePaystack } from "@/lib/payments/paystack"

const inputSchema = z.object({
  slug: z.string().min(1),
  cart: z.object({
    planId: z.string().nullable(),
    slots: z
      .array(
        z.object({
          mealSlotId: z.string().min(1),
          items: z
            .array(
              z.object({
                variantId: z.string().min(1),
                quantity: z.number().int().min(1).max(20),
              }),
            )
            .min(1)
            .max(20),
        }),
      )
      .min(1)
      .max(40),
  }),
  attendee: z.object({
    fullName: z.string().trim().min(2).max(80),
    phone: z.string().trim().min(7).max(20),
    email: z.string().trim().email().max(120),
    numberOfPeople: z.number().int().min(1).max(50),
    deliveryPointId: z.string().min(1),
    dietaryNotes: z.string().trim().max(400),
    isGroupOrder: z.boolean(),
    groupName: z.string().trim().max(80),
    acceptedTerms: z.literal(true),
  }),
})

export type PlaceOrderInput = z.infer<typeof inputSchema>

export type PlacedOrder = {
  ok: true
  mode: "mock" | "live"
  reference: string
  accessToken: string
  totalKobo: number
  email: string
  publicKey: string | null
  programmeId: string
}

class CheckoutRejection extends Error {}

function slotReason(state: SlotState) {
  if (state === "sold_out") return "is sold out"
  if (state === "not_served") return "is not served"
  if (state === "programme_closed") return "is not open for orders"
  return "is closed"
}

export async function createPendingOrder(raw: PlaceOrderInput): Promise<PlacedOrder | { ok: false; error: string }> {
  const parsed = inputSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: "Check the form and try again." }
  const { slug, cart, attendee } = parsed.data
  if (attendee.isGroupOrder && attendee.groupName.length < 2) {
    return { ok: false, error: "Add the family or department name." }
  }
  const phone = normaliseNigerianPhone(attendee.phone)
  if (!phone) return { ok: false, error: "Enter a Nigerian mobile, like 0803 000 0000." }
  const email = attendee.email.toLowerCase()
  const secret = process.env.PASS_TOKEN_SECRET
  if (!secret) return { ok: false, error: "Meal passes are not configured yet." }

  let created: { id: string; reference: string; accessToken: string; totalKobo: number; programmeId: string } | null = null
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      created = await prisma.$transaction(async (tx) => {
        const programme = await tx.programme.findUnique({
          where: { slug },
          include: {
            venue: { include: { deliveryPoints: true } },
            mealPlans: { include: { periods: true } },
            slots: { include: { mealPeriod: true } },
            menuItems: {
              where: { isActive: true },
              include: { periods: true, variant: { include: { menuItem: true } } },
            },
          },
        })
        if (!programme || programme.status === "DRAFT" || programme.status === "ARCHIVED") {
          throw new CheckoutRejection("That programme is not open.")
        }
        const point = programme.venue.deliveryPoints.find(
          (item) => item.id === attendee.deliveryPointId && item.isActive,
        )
        if (!point) throw new CheckoutRejection("Choose a delivery point at the venue.")

        const slotIds = [...new Set(cart.slots.map((slot) => slot.mealSlotId))].sort()
        await tx.$queryRaw`SELECT id FROM "MealSlot" WHERE id IN (${Prisma.join(slotIds)}) FOR UPDATE`
        const now = new Date()
        const heldRows = await tx.orderSlot.findMany({
          where: {
            mealSlotId: { in: slotIds },
            status: { not: "CANCELLED" },
            order: {
              OR: [
                { status: { in: ["PAID", "PARTIALLY_FULFILLED", "FULFILLED"] } },
                { status: "PENDING_PAYMENT", createdAt: { gt: new Date(now.getTime() - PENDING_HOLD_MS) } },
              ],
            },
          },
          select: { mealSlotId: true, order: { select: { status: true, createdAt: true } } },
        })
        const heldBySlot = new Map<string, { status: string; createdAt: Date }[]>()
        for (const row of heldRows) {
          const list = heldBySlot.get(row.mealSlotId) ?? []
          list.push(row.order)
          heldBySlot.set(row.mealSlotId, list)
        }

        const slotById = new Map(programme.slots.map((slot) => [slot.id, slot]))
        const offeringByVariant = new Map(programme.menuItems.map((item) => [item.variantId, item]))
        const checkoutSlots: CheckoutSlot[] = []
        const problems: string[] = []
        for (const entry of cart.slots) {
          const slot = slotById.get(entry.mealSlotId)
          if (!slot || slot.programmeId !== programme.id) {
            problems.push("A slot is no longer on this programme.")
            continue
          }
          const dateKey = lagosDateKey(slot.date)
          const hasMenu = programme.menuItems.some((item) =>
            item.periods.some((period) => period.mealPeriodId === slot.mealPeriodId),
          )
          const state = checkoutSlotState({
            programmeStatus: programme.status,
            isOpen: slot.isOpen,
            hasMenu,
            now,
            deliveryStart: deliveryStartFromKey(dateKey, slot.mealPeriod.deliveryWindowStart),
            cutoffHours: programme.orderCutoffHours,
            capacity: slot.capacity,
            orders: heldBySlot.get(slot.id) ?? [],
          })
          const label = `${formatDayLabel(slot.date)} ${slot.mealPeriod.name}`
          if (state !== "open") {
            problems.push(`${label} ${slotReason(state)}.`)
            continue
          }
          const lines: CheckoutSlot["lines"] = []
          for (const item of entry.items) {
            const offering = offeringByVariant.get(item.variantId)
            const offeredHere = offering?.periods.some((period) => period.mealPeriodId === slot.mealPeriodId)
            if (!offering || !offeredHere || !offering.variant.isAvailable) {
              problems.push(`A plate on ${label} is not served.`)
              continue
            }
            lines.push({
              variantId: item.variantId,
              nameSnapshot: `${offering.variant.menuItem.name} · ${offering.variant.name}`,
              variantLabelSnapshot: offering.variant.name,
              quantity: item.quantity,
              unitPriceKobo: offering.priceKoboOverride ?? offering.variant.priceKobo,
            })
          }
          if (lines.length > 0) {
            checkoutSlots.push({ mealSlotId: slot.id, dateKey, periodId: slot.mealPeriodId, lines })
          }
        }
        if (problems.length > 0) throw new CheckoutRejection(problems[0] ?? "Those slots are not open.")
        if (checkoutSlots.length === 0) throw new CheckoutRejection("Add a meal before you pay.")

        const planRecord = cart.planId
          ? programme.mealPlans.find((plan) => plan.id === cart.planId && plan.isActive)
          : null
        const plan: PlanRule | null = planRecord
          ? {
              coversAllDays: planRecord.coversAllDays,
              periodIds: planRecord.periods.map((period) => period.mealPeriodId),
              pricingMode: planRecord.pricingMode,
              fixedPricePerSlotKobo: planRecord.fixedPricePerSlotKobo,
              discountPercent: planRecord.discountPercent,
            }
          : null
        const dateKeys = [...new Set(programme.slots.map((slot) => lagosDateKey(slot.date)))]
        const priced = priceCheckout({ clientTotalKobo: 0, programmeDateKeys: dateKeys, plan, slots: checkoutSlots })
        const latest = await tx.order.findFirst({
          where: { programmeId: programme.id, reference: { startsWith: `DM-${programme.code}-` } },
          orderBy: { reference: "desc" },
          select: { reference: true },
        })
        const next = latest ? Number(latest.reference.split("-").pop()) + 1 : 1
        const reference = `DM-${programme.code}-${String(next).padStart(5, "0")}`
        const accessToken = randomBytes(24).toString("base64url")
        const person = await tx.attendee.upsert({
          where: { phone },
          create: { fullName: attendee.fullName, phone, email },
          update: { fullName: attendee.fullName, email },
        })
        const order = await tx.order.create({
          data: {
            reference,
            attendeeId: person.id,
            programmeId: programme.id,
            status: "PENDING_PAYMENT",
            subtotalKobo: priced.subtotalKobo,
            discountKobo: priced.discountKobo,
            deliveryFeeKobo: priced.deliveryFeeKobo,
            serviceFeeKobo: priced.serviceFeeKobo,
            totalKobo: priced.totalKobo,
            deliveryPointId: point.id,
            numberOfPeople: attendee.numberOfPeople,
            dietaryNotes: attendee.dietaryNotes,
            mealPlanId: priced.planApplied ? planRecord?.id : null,
            paystackReference: reference,
            isGroupOrder: attendee.isGroupOrder,
            groupName: attendee.isGroupOrder ? attendee.groupName : null,
            accessToken,
            slots: {
              create: priced.slots.map((slot) => ({
                mealSlotId: slot.mealSlotId,
                status: "SCHEDULED",
                passToken: `pending-${randomBytes(18).toString("base64url")}`,
                items: {
                  create: slot.lines.map((line) => ({
                    variantId: line.variantId,
                    quantity: line.quantity,
                    unitPriceKobo: line.unitPriceKobo,
                    nameSnapshot: line.nameSnapshot,
                    variantLabelSnapshot: line.variantLabelSnapshot,
                  })),
                },
              })),
            },
            payment: {
              create: {
                reference,
                amountKobo: priced.totalKobo,
                currency: "NGN",
                status: "PENDING",
              },
            },
          },
          include: { slots: { include: { mealSlot: { include: { mealPeriod: true } } } } },
        })
        for (const slot of order.slots) {
          const dateKey = lagosDateKey(slot.mealSlot.date)
          const end = deliveryStartFromKey(dateKey, slot.mealSlot.mealPeriod.deliveryWindowEnd)
          const expiryUnix = Math.floor(end.getTime() / 1000) + 2 * 60 * 60
          await tx.orderSlot.update({
            where: { id: slot.id },
            data: { passToken: signPassToken(slot.id, slot.mealSlotId, expiryUnix, secret) },
          })
        }
        return {
          id: order.id,
          reference: order.reference,
          accessToken: order.accessToken,
          totalKobo: order.totalKobo,
          programmeId: programme.id,
        }
      })
      break
    } catch (error) {
      if (error instanceof CheckoutRejection) return { ok: false, error: error.message }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" && attempt < 2) continue
      throw error
    }
  }
  if (!created) return { ok: false, error: "We couldn't reserve those seats. Try again." }

  const mode = paymentsMode()
  if (mode === "live") {
    try {
      await initialisePaystack({
        email,
        amountKobo: created.totalKobo,
        reference: created.reference,
        callbackUrl: `${siteUrl()}/orders/${created.reference}?token=${created.accessToken}`,
      })
    } catch (error) {
      await prisma.orderSlot.updateMany({ where: { orderId: created.id }, data: { status: "CANCELLED" } })
      await prisma.order.update({ where: { id: created.id }, data: { status: "CANCELLED" } })
      const message = error instanceof Error ? error.message : "Paystack did not start."
      return { ok: false, error: message }
    }
  }

  return {
    ok: true,
    mode,
    reference: created.reference,
    accessToken: created.accessToken,
    totalKobo: created.totalKobo,
    email,
    publicKey: mode === "live" ? process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || null : null,
    programmeId: created.programmeId,
  }
}
