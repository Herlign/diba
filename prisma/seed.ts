import { PrismaClient, type PlanPricingMode, type StaffRole } from "@prisma/client"
import bcrypt from "bcryptjs"
import { addDays, format, parseISO } from "date-fns"
import { fromZonedTime } from "date-fns-tz"

const prisma = new PrismaClient()
const TZ = "Africa/Lagos"

const STAFF = [
  {
    email: "ada.admin@dibameals.test",
    name: "Adaeze Okonkwo",
    role: "SUPER_ADMIN" as StaffRole,
    password: "DibaAdmin!2026",
  },
  {
    email: "kitchen@dibameals.test",
    name: "Diba Kitchen",
    role: "KITCHEN" as StaffRole,
    password: "DibaKitchen!2026",
  },
  {
    email: "dispatch@dibameals.test",
    name: "Seyi Adebayo",
    role: "DISPATCH" as StaffRole,
    password: "DibaDispatch!2026",
  },
]

type VariantSeed = {
  name: string
  priceKobo: number
  serves?: number
  prep?: number
}

type ItemSeed = {
  slug: string
  name: string
  description: string
  imageUrl: string
  category: string
  tags: string[]
  variants: VariantSeed[]
}

const categories = [
  { slug: "breakfast", name: "Breakfast", position: 0 },
  { slug: "rice-dishes", name: "Rice Dishes", position: 1 },
  { slug: "swallow", name: "Swallow", position: 2 },
  { slug: "snacks", name: "Snacks", position: 3 },
  { slug: "sides", name: "Sides", position: 4 },
  { slug: "drinks", name: "Drinks", position: 5 },
]

function family(priceKobo: number) {
  return Math.round((priceKobo * 3.2) / 10000) * 10000
}

const items: ItemSeed[] = [
  {
    slug: "akara-pap",
    name: "Akara & Pap",
    description: "Crisp bean cakes with warm pap, packed for an early session.",
    imageUrl: "/images/plantain.jpg",
    category: "breakfast",
    tags: ["vegetarian"],
    variants: [{ name: "Regular", priceKobo: 350000, prep: 25 }],
  },
  {
    slug: "yam-egg",
    name: "Yam & Egg Sauce",
    description: "Boiled yam with peppered egg sauce.",
    imageUrl: "/images/yam-egg.jpg",
    category: "breakfast",
    tags: [],
    variants: [{ name: "Regular", priceKobo: 500000, prep: 30 }],
  },
  {
    slug: "bread-omelette",
    name: "Bread & Omelette + Tea",
    description: "Buttered bread, a folded omelette, and a flask of tea.",
    imageUrl: "/images/yam-egg.jpg",
    category: "breakfast",
    tags: [],
    variants: [{ name: "Regular", priceKobo: 400000, prep: 20 }],
  },
  {
    slug: "jollof-chicken",
    name: "Jollof Rice + Chicken",
    description: "Smoky party jollof with grilled chicken.",
    imageUrl: "/images/jollof.jpg",
    category: "rice-dishes",
    tags: [],
    variants: [
      { name: "Regular", priceKobo: 650000, prep: 45 },
      { name: "Large", priceKobo: 900000, serves: 1, prep: 45 },
      { name: "Family pack – 4 people", priceKobo: family(650000), serves: 4, prep: 60 },
    ],
  },
  {
    slug: "fried-rice-turkey",
    name: "Fried Rice + Turkey",
    description: "Vegetable fried rice with peppered turkey.",
    imageUrl: "/images/jollof-platter.jpg",
    category: "rice-dishes",
    tags: [],
    variants: [
      { name: "Regular", priceKobo: 950000, prep: 45 },
      { name: "Large", priceKobo: 1200000, prep: 45 },
      { name: "Family pack – 4 people", priceKobo: family(950000), serves: 4, prep: 60 },
    ],
  },
  {
    slug: "ofada-ayamase",
    name: "Ofada Rice + Ayamase",
    description: "Ofada rice, green ayamase, and a boiled egg.",
    imageUrl: "/images/jollof.jpg",
    category: "rice-dishes",
    tags: ["spicy"],
    variants: [
      { name: "Regular", priceKobo: 850000, prep: 50 },
      { name: "Family pack – 4 people", priceKobo: family(850000), serves: 4, prep: 70 },
    ],
  },
  {
    slug: "coconut-rice",
    name: "Coconut Rice + Chicken",
    description: "Mild coconut rice with grilled chicken.",
    imageUrl: "/images/jollof-platter.jpg",
    category: "rice-dishes",
    tags: [],
    variants: [{ name: "Regular", priceKobo: 780000, prep: 45 }],
  },
  {
    slug: "white-rice-beef",
    name: "White Rice + Beef Stew",
    description: "White rice with tomato stew and stewed beef.",
    imageUrl: "/images/jollof.jpg",
    category: "rice-dishes",
    tags: [],
    variants: [{ name: "Regular", priceKobo: 650000, prep: 40 }],
  },
  {
    slug: "spaghetti",
    name: "Spaghetti Stir-fry",
    description: "Stir-fried spaghetti with peppered chicken.",
    imageUrl: "/images/jollof-platter.jpg",
    category: "rice-dishes",
    tags: [],
    variants: [
      { name: "Regular", priceKobo: 600000, prep: 35 },
      { name: "Family pack – 4 people", priceKobo: family(600000), serves: 4, prep: 50 },
    ],
  },
  {
    slug: "amala-ewedu",
    name: "Amala + Ewedu + Beef",
    description: "Soft amala, ewedu, and beef stew.",
    imageUrl: "/images/egusi.jpg",
    category: "swallow",
    tags: [],
    variants: [
      { name: "Regular", priceKobo: 700000, prep: 40 },
      { name: "Family pack – 4 people", priceKobo: family(700000), serves: 4, prep: 55 },
    ],
  },
  {
    slug: "pounded-yam-egusi",
    name: "Pounded Yam + Egusi + Goat Meat",
    description: "Pounded yam with egusi and goat meat.",
    imageUrl: "/images/egusi.jpg",
    category: "swallow",
    tags: ["spicy"],
    variants: [
      { name: "Regular", priceKobo: 900000, prep: 50 },
      { name: "Family pack – 4 people", priceKobo: family(900000), serves: 4, prep: 70 },
    ],
  },
  {
    slug: "eba-okro",
    name: "Eba + Seafood Okro",
    description: "Eba with seafood okro.",
    imageUrl: "/images/egusi.jpg",
    category: "swallow",
    tags: ["spicy"],
    variants: [{ name: "Regular", priceKobo: 750000, prep: 40 }],
  },
  {
    slug: "semo-ogbono",
    name: "Semovita + Ogbono",
    description: "Semovita with ogbono and assorted meat.",
    imageUrl: "/images/egusi.jpg",
    category: "swallow",
    tags: ["spicy"],
    variants: [{ name: "Regular", priceKobo: 820000, prep: 40 }],
  },
  {
    slug: "peppered-fish",
    name: "Peppered Fish",
    description: "Fried fish in a light pepper sauce. A lean plate.",
    imageUrl: "/images/grilled-fish.jpg",
    category: "rice-dishes",
    tags: ["spicy"],
    variants: [{ name: "Regular", priceKobo: 850000, prep: 35 }],
  },
  {
    slug: "grilled-chicken",
    name: "Grilled Chicken Plate",
    description: "Charred chicken with a small side of salad.",
    imageUrl: "/images/grilled-chicken.jpg",
    category: "snacks",
    tags: [],
    variants: [{ name: "Regular", priceKobo: 750000, prep: 35 }],
  },
  {
    slug: "meat-pie",
    name: "Meat Pie",
    description: "A warm meat pie for the break between sessions.",
    imageUrl: "/images/plantain.jpg",
    category: "snacks",
    tags: [],
    variants: [{ name: "Regular", priceKobo: 150000, prep: 15 }],
  },
  {
    slug: "moi-moi",
    name: "Moi Moi",
    description: "Steamed bean pudding, wrapped for the hall.",
    imageUrl: "/images/plantain.jpg",
    category: "sides",
    tags: ["vegetarian"],
    variants: [{ name: "Regular", priceKobo: 150000, prep: 20 }],
  },
  {
    slug: "fried-plantain",
    name: "Fried Plantain",
    description: "Sweet fried plantain.",
    imageUrl: "/images/plantain.jpg",
    category: "sides",
    tags: ["vegetarian"],
    variants: [{ name: "Regular", priceKobo: 120000, prep: 15 }],
  },
  {
    slug: "zobo",
    name: "Fruity Zobo 50cl",
    description: "Chilled hibiscus with ginger and pineapple.",
    imageUrl: "/images/jollof-platter.jpg",
    category: "drinks",
    tags: ["vegetarian"],
    variants: [{ name: "50cl", priceKobo: 190000, prep: 5 }],
  },
  {
    slug: "chapman",
    name: "Chapman 50cl",
    description: "Chapman with a slice of cucumber.",
    imageUrl: "/images/jollof-platter.jpg",
    category: "drinks",
    tags: ["vegetarian"],
    variants: [{ name: "50cl", priceKobo: 250000, prep: 5 }],
  },
  {
    slug: "bottled-water",
    name: "Bottled Water",
    description: "75cl still water.",
    imageUrl: "/images/jollof-platter.jpg",
    category: "drinks",
    tags: [],
    variants: [{ name: "75cl", priceKobo: 50000, prep: 1 }],
  },
]

const morningSlugs = [
  "akara-pap",
  "yam-egg",
  "bread-omelette",
  "moi-moi",
  "fried-plantain",
  "zobo",
  "chapman",
  "bottled-water",
  "meat-pie",
]

const eveningSlugs = [
  "jollof-chicken",
  "fried-rice-turkey",
  "ofada-ayamase",
  "coconut-rice",
  "white-rice-beef",
  "spaghetti",
  "amala-ewedu",
  "pounded-yam-egusi",
  "eba-okro",
  "semo-ogbono",
  "peppered-fish",
  "grilled-chicken",
  "moi-moi",
  "fried-plantain",
  "zobo",
  "chapman",
  "bottled-water",
]

function eachDay(start: string, end: string) {
  const days: string[] = []
  let cursor = parseISO(start)
  const last = parseISO(end)
  while (cursor.getTime() <= last.getTime()) {
    days.push(format(cursor, "yyyy-MM-dd"))
    cursor = addDays(cursor, 1)
  }
  return days
}

function utcDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number)
  return new Date(Date.UTC(year!, month! - 1, day))
}

function cutoffAt(isoDate: string, windowStart: string, hours: number) {
  const start = fromZonedTime(`${isoDate}T${windowStart}:00`, TZ)
  return new Date(start.getTime() - hours * 60 * 60 * 1000)
}

async function reset() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "Payment",
      "OrderItem",
      "OrderSlot",
      "Order",
      "Attendee",
      "MealPlanPeriod",
      "MealPlan",
      "ProgrammeMenuItemPeriod",
      "ProgrammeMenuItem",
      "MealSlot",
      "MealPeriod",
      "PromoCode",
      "Programme",
      "DeliveryPoint",
      "Venue",
      "MenuItemVariant",
      "MenuItem",
      "Category",
      "StaffUser",
      "Church"
    RESTART IDENTITY CASCADE
  `)
}

async function main() {
  await reset()

  for (const member of STAFF) {
    await prisma.staffUser.create({
      data: {
        email: member.email,
        name: member.name,
        role: member.role,
        passwordHash: bcrypt.hashSync(member.password, 10),
      },
    })
  }

  for (const category of categories) {
    await prisma.category.create({ data: category })
  }

  for (const [index, item] of items.entries()) {
    const category = await prisma.category.findUniqueOrThrow({ where: { slug: item.category } })
    await prisma.menuItem.create({
      data: {
        slug: item.slug,
        name: item.name,
        description: item.description,
        imageUrl: item.imageUrl,
        dietaryTags: item.tags,
        position: index,
        categoryId: category.id,
        variants: {
          create: item.variants.map((variant, position) => ({
            name: variant.name,
            priceKobo: variant.priceKobo,
            servesCount: variant.serves ?? 1,
            prepMinutes: variant.prep ?? 30,
            position,
          })),
        },
      },
    })
  }

  const church = await prisma.church.create({
    data: {
      name: "Grace Assembly Lagos",
      slug: "grace-assembly-lagos",
      contactPhone: "+2348090002210",
      contactEmail: "programmes@graceassembly.test",
    },
  })

  const venue = await prisma.venue.create({
    data: {
      name: "Grace Camp Ground, Lekki-Epe Expressway",
      address: "Grace Camp Ground, Lekki-Epe Expressway, Lagos",
      lat: 6.4583,
      lng: 3.6015,
      notes: "Enter via Gate 2",
      deliveryPoints: {
        create: [
          { name: "Main Auditorium – Gate A", description: "Left of the pulpit, under the balcony.", position: 0 },
          { name: "Hostel Block C", description: "Ask the camp secretariat at the lodge.", position: 1 },
          { name: "Children's Church Hall", description: "Annex behind the main bowl.", position: 2 },
        ],
      },
    },
  })

  await createProgramme({
    churchId: church.id,
    venueId: venue.id,
    title: "Crossover Convention 2026",
    slug: "crossover-convention-2026",
    code: "CROSS26",
    description:
      "Five days at Grace Camp Ground. Morning packs land before the first session. Evening packs are at your block when the benediction drops.",
    coverImageUrl: "/images/jollof.jpg",
    startDate: "2026-12-27",
    endDate: "2026-12-31",
    status: "PUBLISHED",
    orderCutoffHours: 24,
    maxOrdersPerSlot: 300,
    periods: [
      { name: "Morning", start: "07:00", end: "09:00", position: 0, slugs: morningSlugs },
      { name: "Evening", start: "18:00", end: "20:00", position: 1, slugs: eveningSlugs },
    ],
    plans: [
      {
        name: "Full Programme – Morning + Evening",
        description: "Every morning and every evening, Sunday through Thursday. You still pick the plates.",
        coversAllDays: true,
        pricingMode: "PERCENT_DISCOUNT",
        discountPercent: 10,
        periods: ["Morning", "Evening"],
        isPopular: true,
        position: 0,
      },
      {
        name: "Evenings Only",
        description: "Skip breakfast. Evening plates for all five nights.",
        coversAllDays: true,
        pricingMode: "PERCENT_DISCOUNT",
        discountPercent: 5,
        periods: ["Evening"],
        isPopular: false,
        position: 1,
      },
      {
        name: "Weekend Only",
        description: "Opening Sunday, 27 Dec, morning and evening. You pick that day rather than the whole week.",
        coversAllDays: false,
        pricingMode: "PERCENT_DISCOUNT",
        discountPercent: 8,
        periods: ["Morning", "Evening"],
        isPopular: false,
        position: 2,
      },
    ],
  })

  await createProgramme({
    churchId: church.id,
    venueId: venue.id,
    title: "Year-End Retreat",
    slug: "year-end-retreat",
    code: "RETREAT26",
    description: "Three quiet mornings at the camp. Breakfast only, before the teaching starts.",
    coverImageUrl: "/images/plantain.jpg",
    startDate: "2026-12-18",
    endDate: "2026-12-20",
    status: "PUBLISHED",
    orderCutoffHours: 24,
    maxOrdersPerSlot: 300,
    periods: [{ name: "Morning", start: "07:00", end: "09:00", position: 0, slugs: morningSlugs }],
    plans: [],
  })

  await createProgramme({
    churchId: church.id,
    venueId: venue.id,
    title: "Ministers' Preview",
    slug: "ministers-preview",
    code: "DRAFT26",
    description: "Still a draft. Hidden from the public list.",
    coverImageUrl: "/images/egusi.jpg",
    startDate: "2027-01-08",
    endDate: "2027-01-09",
    status: "DRAFT",
    orderCutoffHours: 24,
    maxOrdersPerSlot: 40,
    periods: [{ name: "Morning", start: "07:00", end: "09:00", position: 0, slugs: ["bread-omelette", "bottled-water"] }],
    plans: [],
  })

  const crossover = await prisma.programme.findUniqueOrThrow({ where: { code: "CROSS26" } })
  await prisma.promoCode.create({
    data: {
      code: "CROSS10",
      discountType: "PERCENT",
      percentOff: 10,
      programmeId: crossover.id,
      usageLimit: 100,
      expiresAt: fromZonedTime("2026-12-26T23:59:00", TZ),
    },
  })

  console.log("Seeded Grace Assembly, CROSS26, RETREAT26, and staff accounts.")
  for (const member of STAFF) {
    console.log(`${member.role} ${member.email} / ${member.password}`)
  }
}

async function createProgramme(input: {
  churchId: string
  venueId: string
  title: string
  slug: string
  code: string
  description: string
  coverImageUrl: string
  startDate: string
  endDate: string
  status: "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED"
  orderCutoffHours: number
  maxOrdersPerSlot: number
  periods: { name: string; start: string; end: string; position: number; slugs: string[] }[]
  plans: {
    name: string
    description: string
    coversAllDays: boolean
    pricingMode: PlanPricingMode
    discountPercent: number
    periods: string[]
    isPopular: boolean
    position: number
  }[]
}) {
  const programme = await prisma.programme.create({
    data: {
      churchId: input.churchId,
      venueId: input.venueId,
      title: input.title,
      slug: input.slug,
      code: input.code,
      description: input.description,
      coverImageUrl: input.coverImageUrl,
      startDate: utcDate(input.startDate),
      endDate: utcDate(input.endDate),
      status: input.status,
      orderCutoffHours: input.orderCutoffHours,
      maxOrdersPerSlot: input.maxOrdersPerSlot,
      mealPeriods: {
        create: input.periods.map((period) => ({
          name: period.name,
          deliveryWindowStart: period.start,
          deliveryWindowEnd: period.end,
          position: period.position,
        })),
      },
    },
    include: { mealPeriods: true },
  })

  const periodByName = new Map(programme.mealPeriods.map((period) => [period.name, period]))
  const days = eachDay(input.startDate, input.endDate)

  for (const day of days) {
    for (const period of programme.mealPeriods) {
      await prisma.mealSlot.create({
        data: {
          programmeId: programme.id,
          mealPeriodId: period.id,
          date: utcDate(day),
          capacity: input.maxOrdersPerSlot,
          isOpen: true,
          cutoffAt: cutoffAt(day, period.deliveryWindowStart, input.orderCutoffHours),
        },
      })
    }
  }

  for (const periodSpec of input.periods) {
    const period = periodByName.get(periodSpec.name)
    if (!period) continue
    for (const slug of periodSpec.slugs) {
      const item = await prisma.menuItem.findUniqueOrThrow({
        where: { slug },
        include: { variants: true },
      })
      for (const variant of item.variants) {
        const offering = await prisma.programmeMenuItem.upsert({
          where: { programmeId_variantId: { programmeId: programme.id, variantId: variant.id } },
          update: {},
          create: { programmeId: programme.id, variantId: variant.id },
        })
        await prisma.programmeMenuItemPeriod.upsert({
          where: {
            programmeMenuItemId_mealPeriodId: {
              programmeMenuItemId: offering.id,
              mealPeriodId: period.id,
            },
          },
          update: {},
          create: { programmeMenuItemId: offering.id, mealPeriodId: period.id },
        })
      }
    }
  }

  for (const plan of input.plans) {
    await prisma.mealPlan.create({
      data: {
        programmeId: programme.id,
        name: plan.name,
        description: plan.description,
        coversAllDays: plan.coversAllDays,
        pricingMode: plan.pricingMode,
        discountPercent: plan.discountPercent,
        attendeeChoosesItems: true,
        isPopular: plan.isPopular,
        position: plan.position,
        periods: {
          create: plan.periods.map((name) => ({
            mealPeriodId: periodByName.get(name)!.id,
          })),
        },
      },
    })
  }
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
