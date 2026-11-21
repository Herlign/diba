import { PrismaClient } from "@prisma/client"
import {
  BatchStatus,
  DeliveryStatus,
  Fulfilment,
  MealKind,
  MenuCategory,
  OrderStatus,
  PaymentStatus,
  ProgrammeStatus,
  UserRole,
} from "../src/lib/domain"

const prisma = new PrismaClient()

function lagosDate(offsetDays: number, hour: number, minute = 0) {
  const lagosNow = new Date(Date.now() + 60 * 60 * 1000)
  return new Date(
    Date.UTC(
      lagosNow.getUTCFullYear(),
      lagosNow.getUTCMonth(),
      lagosNow.getUTCDate() + offsetDays,
      hour - 1,
      minute,
      0,
      0,
    ),
  )
}

function weekday(offsetDays: number) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    timeZone: "Africa/Lagos",
  }).format(lagosDate(offsetDays, 12))
}

type SlotSpec = {
  kind: string
  label: string
  hour: number
  minute?: number
  plates: string[]
  extras?: string[]
  maxPlates?: number
}

type DaySpec = {
  offset: number
  note: string
  slots: SlotSpec[]
}

function offeringsFor(slot: SlotSpec) {
  return [
    ...slot.plates.map((slug) => ({
      menuItem: { connect: { slug } },
      maxPortions: slot.maxPlates ?? 180,
    })),
    ...(slot.extras ?? []).map((slug) => ({
      menuItem: { connect: { slug } },
      maxPortions: 400,
    })),
  ]
}

function dayCreate(day: DaySpec, sortOrder: number) {
  return {
    date: lagosDate(day.offset, 12),
    label: `${weekday(day.offset)} · ${day.note}`,
    sortOrder,
    slots: {
      create: day.slots.map((slot, index) => ({
        kind: slot.kind,
        label: slot.label,
        serveAt: lagosDate(day.offset, slot.hour, slot.minute ?? 0),
        orderCutoffAt: lagosDate(day.offset - 1, 18),
        sortOrder: index,
        offerings: { create: offeringsFor(slot) },
      })),
    },
  }
}

const drinks = ["zobo", "bottled-water"]

const menu = [
  {
    slug: "party-jollof-chicken",
    name: "Party jollof & grilled chicken",
    description: "Smoky party jollof, grilled chicken, and a side of coleslaw.",
    category: MenuCategory.PLATE,
    priceKobo: 750000,
    spiceLevel: "MEDIUM",
  },
  {
    slug: "native-jollof-fish",
    name: "Native jollof & fried fish",
    description: "Native jollof with fried fish, plantain, and ata dindin.",
    category: MenuCategory.PLATE,
    priceKobo: 850000,
    spiceLevel: "HOT",
  },
  {
    slug: "fried-rice-turkey",
    name: "Fried rice & peppered turkey",
    description: "Vegetable fried rice with peppered turkey and plantain.",
    category: MenuCategory.PLATE,
    priceKobo: 950000,
    spiceLevel: "MEDIUM",
  },
  {
    slug: "ofada-ayamase",
    name: "Ofada rice, ayamase & egg",
    description: "Ofada rice, green ayamase, boiled egg, and plantain.",
    category: MenuCategory.PLATE,
    priceKobo: 880000,
    spiceLevel: "HOT",
  },
  {
    slug: "coconut-rice-chicken",
    name: "Coconut rice & chicken",
    description: "Mild coconut rice with grilled chicken for a lighter plate.",
    category: MenuCategory.PLATE,
    priceKobo: 780000,
    spiceLevel: "MILD",
  },
  {
    slug: "white-rice-beef",
    name: "White rice, stew & beef",
    description: "White rice, tomato stew, and stewed beef.",
    category: MenuCategory.PLATE,
    priceKobo: 650000,
    spiceLevel: "MILD",
  },
  {
    slug: "pounded-yam-egusi",
    name: "Pounded yam & egusi",
    description: "Pounded yam with egusi and assorted meat.",
    category: MenuCategory.PLATE,
    priceKobo: 850000,
    spiceLevel: "MEDIUM",
  },
  {
    slug: "semo-ogbono",
    name: "Semovita & ogbono",
    description: "Semovita with ogbono and goat meat.",
    category: MenuCategory.PLATE,
    priceKobo: 820000,
    spiceLevel: "HOT",
  },
  {
    slug: "eba-seafood-okro",
    name: "Eba & seafood okro",
    description: "Eba with seafood okro and a little stockfish.",
    category: MenuCategory.PLATE,
    priceKobo: 780000,
    spiceLevel: "MEDIUM",
  },
  {
    slug: "plantain-porridge",
    name: "Plantain porridge & fish",
    description: "Ripe plantain porridge with fried fish.",
    category: MenuCategory.PLATE,
    priceKobo: 680000,
    spiceLevel: "MILD",
  },
  {
    slug: "moi-moi",
    name: "Moi moi",
    description: "Steamed bean pudding, wrapped for the hall.",
    category: MenuCategory.SIDE,
    priceKobo: 150000,
    spiceLevel: "MILD",
    isVegetarian: true,
  },
  {
    slug: "fried-plantain",
    name: "Fried plantain",
    description: "Sweet fried plantain, packed beside the plate.",
    category: MenuCategory.SIDE,
    priceKobo: 120000,
    spiceLevel: "MILD",
    isVegetarian: true,
  },
  {
    slug: "zobo",
    name: "Zobo",
    description: "Chilled hibiscus, ginger, and pineapple.",
    category: MenuCategory.DRINK,
    priceKobo: 100000,
    spiceLevel: "MILD",
    isVegetarian: true,
  },
  {
    slug: "chapman",
    name: "Chapman",
    description: "Fanta, blackcurrant, and a slice of cucumber.",
    category: MenuCategory.DRINK,
    priceKobo: 150000,
    spiceLevel: "MILD",
    isVegetarian: true,
  },
  {
    slug: "bottled-water",
    name: "Bottled water",
    description: "75cl still water.",
    category: MenuCategory.DRINK,
    priceKobo: 50000,
    spiceLevel: "MILD",
    isVegetarian: true,
  },
]

async function main() {
  await prisma.kitchenBatch.deleteMany()
  await prisma.delivery.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.orderLine.deleteMany({ where: { parentLineId: { not: null } } })
  await prisma.order.deleteMany()
  await prisma.slotOffering.deleteMany()
  await prisma.mealSlot.deleteMany()
  await prisma.programmeDay.deleteMany()
  await prisma.dropPoint.deleteMany()
  await prisma.programme.deleteMany()
  await prisma.menuItem.deleteMany()
  await prisma.user.deleteMany()

  await prisma.user.createMany({
    data: [
      {
        email: "ada.okonkwo@dibameals.test",
        name: "Adaeze Okonkwo",
        phone: "+234 809 000 1101",
        role: UserRole.ADMIN,
      },
      {
        email: "kitchen@dibameals.test",
        name: "Diba Kitchen",
        phone: "+234 809 000 1102",
        role: UserRole.KITCHEN,
      },
      {
        email: "seyi.adebayo@dibameals.test",
        name: "Seyi Adebayo",
        phone: "+234 809 000 1103",
        role: UserRole.RIDER,
      },
      {
        email: "tunde.balogun@hillside.test",
        name: "Tunde Balogun",
        phone: "+234 809 000 1104",
        role: UserRole.COORDINATOR,
      },
      {
        email: "amaka.nwosu@guest.test",
        name: "Amaka Nwosu",
        phone: "+234 809 000 1105",
        role: UserRole.ATTENDEE,
      },
    ],
  })

  await prisma.menuItem.createMany({ data: menu })

  const conventionPlates = [
    "party-jollof-chicken",
    "fried-rice-turkey",
    "ofada-ayamase",
    "pounded-yam-egusi",
  ]
  const campPlates = [
    "party-jollof-chicken",
    "fried-rice-turkey",
    "plantain-porridge",
    "white-rice-beef",
  ]
  const lightPlates = ["party-jollof-chicken", "coconut-rice-chicken", "white-rice-beef"]

  await prisma.programme.create({
    data: {
      slug: "hillside-youth-camp",
      title: "Youth Camp Meeting",
      ministryName: "Hillside Chapel",
      summary: "Three days on the Bodija ridge. Lunch after bible study, dinner before the night session.",
      description:
        "Hillside Chapel hosts its youth camp in Bodija. Diba Meals packs lunch and dinner for the main auditorium and the workers' lodge. Order by 6pm the day before each meal.",
      city: "Ibadan",
      state: "Oyo",
      venueName: "Hillside Chapel auditorium",
      venueAddress: "12 Awolowo Avenue, Bodija, Ibadan",
      landmark: "Opposite the old cocoa house junction",
      startsOn: lagosDate(6, 6),
      endsOn: lagosDate(8, 21),
      status: ProgrammeStatus.ORDERING_OPEN,
      accent: "palm",
      contactName: "Tunde Balogun",
      contactPhone: "+234 809 000 1104",
      coordinator: { connect: { email: "tunde.balogun@hillside.test" } },
      dropPoints: {
        create: [
          { name: "Auditorium, Block A", instructions: "Left of the pulpit, under the balcony.", sortOrder: 0 },
          { name: "Auditorium, Block B", instructions: "Right aisle, beside the sound booth.", sortOrder: 1 },
          { name: "Workers' lodge", instructions: "Ask for the camp secretariat.", sortOrder: 2 },
        ],
      },
      days: {
        create: [
          dayCreate({
            offset: 6,
            note: "Arrival",
            slots: [
              { kind: MealKind.LUNCH, label: "Lunch", hour: 13, plates: campPlates, extras: drinks },
              { kind: MealKind.DINNER, label: "Dinner", hour: 18, minute: 30, plates: campPlates, extras: drinks },
            ],
          }, 0),
          dayCreate({
            offset: 7,
            note: "Sessions",
            slots: [
              { kind: MealKind.BREAKFAST, label: "Breakfast", hour: 8, plates: ["plantain-porridge", "white-rice-beef"], extras: drinks, maxPlates: 120 },
              { kind: MealKind.LUNCH, label: "Lunch", hour: 13, plates: campPlates, extras: drinks },
              { kind: MealKind.DINNER, label: "Dinner", hour: 18, minute: 30, plates: campPlates, extras: drinks },
            ],
          }, 1),
          dayCreate({
            offset: 8,
            note: "Sending forth",
            slots: [
              { kind: MealKind.LUNCH, label: "Lunch", hour: 13, plates: campPlates, extras: drinks },
            ],
          }, 2),
        ],
      },
    },
  })

  await prisma.programme.create({
    data: {
      slug: "city-of-light-convention",
      title: "Greater Light Convention",
      ministryName: "City of Light Assembly",
      summary: "Friday arrival dinner, a full Saturday, and Sunday lunch before the closing prayer.",
      description:
        "City of Light Assembly's annual convention at The Arc, Ikeja. Plates are labelled by block and dropped at the auditorium doors when the session ends.",
      city: "Lagos",
      state: "Lagos",
      venueName: "The Arc",
      venueAddress: "18 Oregun Road, Ikeja, Lagos",
      landmark: "Five minutes from Ikeja City Mall",
      startsOn: lagosDate(13, 6),
      endsOn: lagosDate(15, 21),
      status: ProgrammeStatus.ORDERING_OPEN,
      accent: "clay",
      contactName: "Funke Adeyemi",
      contactPhone: "+234 809 000 1201",
      dropPoints: {
        create: [
          { name: "Auditorium, Block A", instructions: "Ground floor, left of the stage.", sortOrder: 0 },
          { name: "Auditorium, Block B", instructions: "Ground floor, right of the stage.", sortOrder: 1 },
          { name: "Children's hall", instructions: "Annex behind the main bowl.", sortOrder: 2 },
          { name: "Ministers' lodge", instructions: "Call the protocol desk on arrival.", sortOrder: 3 },
        ],
      },
      days: {
        create: [
          dayCreate({
            offset: 13,
            note: "Arrival",
            slots: [
              {
                kind: MealKind.DINNER,
                label: "Arrival dinner",
                hour: 18,
                minute: 30,
                plates: conventionPlates,
                extras: [...drinks, "chapman", "moi-moi"],
              },
            ],
          }, 0),
          dayCreate({
            offset: 14,
            note: "Convention day",
            slots: [
              {
                kind: MealKind.LUNCH,
                label: "Lunch",
                hour: 13,
                plates: [...conventionPlates, "eba-seafood-okro"],
                extras: [...drinks, "chapman", "fried-plantain"],
                maxPlates: 400,
              },
              {
                kind: MealKind.DINNER,
                label: "Dinner",
                hour: 18,
                minute: 30,
                plates: conventionPlates,
                extras: drinks,
                maxPlates: 400,
              },
            ],
          }, 1),
          dayCreate({
            offset: 15,
            note: "Thanksgiving",
            slots: [
              {
                kind: MealKind.LUNCH,
                label: "Closing lunch",
                hour: 13,
                plates: conventionPlates,
                extras: drinks,
                maxPlates: 400,
              },
            ],
          }, 2),
        ],
      },
    },
  })

  await prisma.programme.create({
    data: {
      slug: "harbour-watchnight",
      title: "Harbour Watchnight",
      ministryName: "Harbour Fellowship",
      summary: "Crossover on the waterfront. The menu is up; ordering opens closer to the night.",
      description:
        "Harbour Fellowship keeps a crossover service beside the marina. Dinner on the 31st and breakfast after midnight prayer. Ordering is announced, not open yet.",
      city: "Port Harcourt",
      state: "Rivers",
      venueName: "Harbour Fellowship hall",
      venueAddress: "4 Forces Avenue, Old GRA, Port Harcourt",
      landmark: "Near the old GRA roundabout",
      startsOn: lagosDate(40, 18),
      endsOn: lagosDate(41, 10),
      status: ProgrammeStatus.PUBLISHED,
      accent: "gold",
      contactName: "Ibinabo Hart",
      contactPhone: "+234 809 000 1301",
      dropPoints: {
        create: [
          { name: "Main hall, front", instructions: "Collect from the ushers after the benediction.", sortOrder: 0 },
          { name: "Overflow tent", instructions: "Side lawn, white canopy.", sortOrder: 1 },
        ],
      },
      days: {
        create: [
          dayCreate({
            offset: 40,
            note: "Crossover",
            slots: [
              { kind: MealKind.DINNER, label: "Crossover dinner", hour: 19, plates: lightPlates, extras: drinks },
            ],
          }, 0),
          dayCreate({
            offset: 41,
            note: "New morning",
            slots: [
              { kind: MealKind.BREAKFAST, label: "Breakfast", hour: 7, minute: 30, plates: ["plantain-porridge", "white-rice-beef"], extras: drinks },
            ],
          }, 1),
        ],
      },
    },
  })

  await prisma.programme.create({
    data: {
      slug: "kings-table-carol",
      title: "Carol Service Supper",
      ministryName: "King's Table Parish",
      summary: "One seated supper after the carols. The kitchen has closed the list.",
      description:
        "King's Table Parish asked for a single supper after the carol service. Ordering is closed so the kitchen can lock portions.",
      city: "Calabar",
      state: "Cross River",
      venueName: "King's Table Parish",
      venueAddress: "Marian Road, Calabar",
      landmark: "Beside the Marian market gate",
      startsOn: lagosDate(29, 16),
      endsOn: lagosDate(29, 21),
      status: ProgrammeStatus.ORDERING_CLOSED,
      accent: "ink",
      contactName: "Eme Bassey",
      contactPhone: "+234 809 000 1401",
      dropPoints: {
        create: [
          { name: "Parish hall", instructions: "Tables are numbered. Check your pack label.", sortOrder: 0 },
        ],
      },
      days: {
        create: [
          dayCreate({
            offset: 29,
            note: "Carol supper",
            slots: [
              { kind: MealKind.DINNER, label: "Supper", hour: 18, plates: ["fried-rice-turkey", "party-jollof-chicken", "coconut-rice-chicken"], extras: ["chapman", "bottled-water"], maxPlates: 220 },
            ],
          }, 0),
        ],
      },
    },
  })

  const women = await prisma.programme.create({
    data: {
      slug: "grace-women-of-faith",
      title: "Women of Faith Conference",
      ministryName: "Grace Tabernacle",
      summary: "Last weekend in Gwarinpa. Plates were packed for the fellowship hall.",
      description:
        "Grace Tabernacle's women conference has been held. This record stays on the list so coordinators can see a completed programme.",
      city: "Abuja",
      state: "FCT",
      venueName: "Grace Tabernacle",
      venueAddress: "3rd Avenue, Gwarinpa, Abuja",
      landmark: "After the Gwarinpa estate gate",
      startsOn: lagosDate(-14, 8),
      endsOn: lagosDate(-13, 17),
      status: ProgrammeStatus.COMPLETED,
      accent: "palm",
      contactName: "Blessing Danjuma",
      contactPhone: "+234 809 000 1501",
      dropPoints: {
        create: [
          { name: "Fellowship hall", instructions: "Side entrance, not the sanctuary.", sortOrder: 0 },
        ],
      },
      days: {
        create: [
          dayCreate({
            offset: -14,
            note: "Opening",
            slots: [
              { kind: MealKind.LUNCH, label: "Lunch", hour: 13, plates: lightPlates, extras: drinks, maxPlates: 150 },
            ],
          }, 0),
          dayCreate({
            offset: -13,
            note: "Closing",
            slots: [
              { kind: MealKind.LUNCH, label: "Lunch", hour: 13, plates: lightPlates, extras: drinks, maxPlates: 150 },
            ],
          }, 1),
        ],
      },
    },
  })

  await prisma.programme.create({
    data: {
      slug: "enugu-ministers-institute",
      title: "Ministers' Institute",
      ministryName: "Kingdom College",
      summary: "Still a draft. Hidden from the public list until the college confirms dates.",
      description: "A working draft for a January institute in Enugu. Not published.",
      city: "Enugu",
      state: "Enugu",
      venueName: "Kingdom College chapel",
      venueAddress: "Independence Layout, Enugu",
      startsOn: lagosDate(55, 8),
      endsOn: lagosDate(57, 16),
      status: ProgrammeStatus.DRAFT,
      accent: "ink",
      contactName: "Adaeze Okonkwo",
      contactPhone: "+234 809 000 1101",
      dropPoints: {
        create: [{ name: "Chapel foyer", sortOrder: 0 }],
      },
      days: {
        create: [
          dayCreate({
            offset: 55,
            note: "Opening",
            slots: [
              { kind: MealKind.LUNCH, label: "Lunch", hour: 13, plates: ["white-rice-beef"], extras: ["bottled-water"], maxPlates: 80 },
            ],
          }, 0),
        ],
      },
    },
  })

  const offering = await prisma.slotOffering.findFirst({
    where: {
      menuItem: { slug: "party-jollof-chicken" },
      mealSlot: { programmeDay: { programmeId: women.id, sortOrder: 0 } },
    },
    include: { mealSlot: true, menuItem: true },
  })
  const dropPoint = await prisma.dropPoint.findFirst({
    where: { programmeId: women.id, name: "Fellowship hall" },
  })
  const attendee = await prisma.user.findUniqueOrThrow({
    where: { email: "amaka.nwosu@guest.test" },
  })
  const rider = await prisma.user.findUniqueOrThrow({
    where: { email: "seyi.adebayo@dibameals.test" },
  })

  if (!offering || !dropPoint) {
    throw new Error("Seed could not find the sample offering")
  }

  const unit = offering.menuItem.priceKobo
  const drink = await prisma.menuItem.findUniqueOrThrow({ where: { slug: "zobo" } })
  const total = unit + drink.priceKobo

  const order = await prisma.order.create({
    data: {
      reference: "DIBA-WOF-1042",
      userId: attendee.id,
      programmeId: women.id,
      status: OrderStatus.DELIVERED,
      fulfilment: Fulfilment.SECTION_DROP,
      dropPointId: dropPoint.id,
      contactName: attendee.name,
      contactPhone: attendee.phone ?? "",
      guestEmail: attendee.email,
      subtotalKobo: total,
      totalKobo: total,
      placedAt: lagosDate(-16, 11),
      paidAt: lagosDate(-16, 11),
      lines: {
        create: [
          {
            slotOfferingId: offering.id,
            itemName: offering.menuItem.name,
            slotLabel: "Opening · Lunch",
            serveAt: offering.mealSlot.serveAt,
            quantity: 1,
            unitPriceKobo: unit,
            lineTotalKobo: unit,
          },
        ],
      },
      payment: {
        create: {
          provider: "PAYSTACK",
          status: PaymentStatus.SUCCESS,
          amountKobo: total,
          reference: "PSK_TEST_WOF_1042",
          channel: "card",
          paidAt: lagosDate(-16, 11),
          rawPayload: JSON.stringify({ event: "charge.success", reference: "PSK_TEST_WOF_1042" }),
        },
      },
      delivery: {
        create: {
          riderId: rider.id,
          status: DeliveryStatus.DELIVERED,
          assignedAt: lagosDate(-14, 11),
          pickedUpAt: lagosDate(-14, 12, 20),
          deliveredAt: lagosDate(-14, 12, 55),
          proofNote: "Handed to Amaka at the fellowship hall door.",
        },
      },
    },
    include: { lines: true },
  })

  const plateLine = order.lines[0]
  if (!plateLine) throw new Error("Sample order has no plate line")

  await prisma.orderLine.create({
    data: {
      orderId: order.id,
      parentLineId: plateLine.id,
      itemName: drink.name,
      slotLabel: "Opening · Lunch",
      serveAt: offering.mealSlot.serveAt,
      quantity: 1,
      unitPriceKobo: drink.priceKobo,
      lineTotalKobo: drink.priceKobo,
    },
  })

  await prisma.slotOffering.update({
    where: { id: offering.id },
    data: { portionsSold: 1 },
  })

  await prisma.kitchenBatch.create({
    data: {
      mealSlotId: offering.mealSlotId,
      menuItemId: offering.menuItemId,
      slotOfferingId: offering.id,
      portionsPlanned: 1,
      portionsPacked: 1,
      status: BatchStatus.HANDED_OFF,
    },
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
