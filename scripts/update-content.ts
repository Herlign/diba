import { PrismaClient } from "@prisma/client"
import { syncCatalogue } from "../src/lib/sync-catalogue"

const prisma = new PrismaClient()

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required. Example: DATABASE_URL=\"postgresql://...\" npm run content:update")
    process.exit(1)
  }
  // Sequential upserts so a pooled Postgres URL works. A failed run is safe to repeat.
  const summary = await syncCatalogue(prisma)
  console.log("Diba content updated. Staff accounts and orders were not changed.")
  console.log(JSON.stringify(summary, null, 2))
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
