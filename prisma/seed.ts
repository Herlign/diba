import { PrismaClient, type StaffRole } from "@prisma/client"
import bcrypt from "bcryptjs"
import { syncCatalogue } from "../src/lib/sync-catalogue"
import { ensureSiteContent } from "../src/lib/ensure-site-content"

const prisma = new PrismaClient()

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

async function reset() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "HomeTrustPoint",
      "HomeMarqueeItem",
      "HomeSlipLine",
      "HomeShowcase",
      "HomeStep",
      "FaqEntry",
      "SiteContent",
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
  // Portion prices, including party jollof and Hake fish, come from the catalogue sync.
  const summary = await syncCatalogue(prisma)
  await ensureSiteContent(prisma)
  console.log("Seeded staff and the December 2026 programmes. This wipe is for empty databases only. Never seed a database that has real orders.")
  console.log(JSON.stringify(summary, null, 2))
  for (const member of STAFF) {
    console.log(`${member.role} ${member.email} / ${member.password}`)
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
