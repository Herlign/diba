import { PrismaClient } from "@prisma/client"
import { ensureSiteContent } from "../src/lib/ensure-site-content"
import { syncCatalogue } from "../src/lib/sync-catalogue"

const prisma = new PrismaClient()

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required. Example: DATABASE_URL=\"postgresql://...\" npm run content:update")
    process.exit(1)
  }
  // Sequential upserts so a pooled Postgres URL works. A failed run is safe to repeat.
  const summary = await syncCatalogue(prisma)
  await ensureSiteContent(prisma)
  console.log("Diba content checked. Only missing rows were added. Saved dishes, prices, photos, programmes, homepage wording, staff and orders were left as they are.")
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
