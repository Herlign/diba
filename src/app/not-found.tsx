import Link from "next/link"
import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
      <p className="text-sm font-medium tracking-wide text-primary uppercase">Missing page</p>
      <h1 className="mt-2 font-heading text-4xl">That page is not on the menu</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
        The link may be old. The programme list is the place to start.
      </p>
      <Link href="/programmes" className={cn(buttonVariants({ size: "lg" }), "mt-6 h-10 px-4")}>
        Browse programmes
      </Link>
    </div>
  )
}
