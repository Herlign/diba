import Link from "next/link"
import { Logo } from "@/components/layout/logo"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b-4 border-gold bg-palm text-cream">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-2 sm:gap-5" aria-label="Primary">
          <Link href="/programmes" className="link-fade hidden text-sm font-semibold text-cream/90 sm:inline hover:text-gold">
            Programmes
          </Link>
          <Link
            href="/programmes"
            className="link-fade inline-flex h-10 items-center rounded-lg bg-gold px-3 text-sm font-semibold text-ink sm:px-4"
          >
            Open lists
          </Link>
        </nav>
      </div>
    </header>
  )
}
