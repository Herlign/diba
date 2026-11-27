import Link from "next/link"
import { Logo } from "@/components/layout/logo"

export function SiteHeader({
  programmes,
  orders,
  cta,
  logoUrl,
  logoAlt,
}: {
  programmes: string
  orders: string
  cta: string
  logoUrl: string | null
  logoAlt: string
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 text-ink backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Logo priority src={logoUrl} alt={logoAlt} />
        <nav className="flex items-center gap-2 sm:gap-5" aria-label="Primary">
          <Link href="/programmes" className="link-fade hidden text-sm font-semibold text-ink/80 sm:inline hover:text-palm">
            {programmes}
          </Link>
          <Link href="/my-orders" className="link-fade text-sm font-semibold text-ink/80 hover:text-palm">
            {orders}
          </Link>
          <Link
            href="/programmes"
            className="link-fade inline-flex h-10 items-center rounded-lg bg-palm px-3 text-sm font-semibold text-cream sm:px-4"
          >
            {cta}
          </Link>
        </nav>
      </div>
    </header>
  )
}
