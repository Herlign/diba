import Link from "next/link"
import { buttonVariants } from "@/components/ui/button-variants"
import { getSiteContent } from "@/lib/site-content"
import { cn } from "@/lib/utils"

export default async function NotFound() {
  const content = await getSiteContent()
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
      <p className="text-sm font-medium tracking-wide text-primary uppercase">{content.missingEyebrow}</p>
      <h1 className="mt-2 font-heading text-4xl">{content.missingTitle}</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">{content.missingBody}</p>
      <Link href="/programmes" className={cn(buttonVariants({ size: "lg" }), "mt-6 h-10 px-4")}>
        {content.missingButton}
      </Link>
    </div>
  )
}
