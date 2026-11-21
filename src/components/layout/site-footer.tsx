import Link from "next/link"
import { Logo } from "@/components/layout/logo"
import { foodPhotos } from "@/lib/food-photos"

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-palm text-cream">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-md space-y-3">
            <Logo />
            <p className="text-sm leading-6 text-cream/80">
              Cooked in Lagos and Ile-Ife. Packed with your name on it, and dropped at the church — not at a random junction.
            </p>
          </div>
          <div className="text-sm text-cream/80">
            <p>Orders lock at 6pm the day before each meal.</p>
            <Link href="/programmes" className="link-fade mt-2 inline-block font-semibold text-gold">
              See who&apos;s eating
            </Link>
          </div>
        </div>
        <div className="border-t border-cream/15 pt-4 text-xs leading-5 text-cream/70">
          <p>
            Food photos, free to use, from Pexels:{" "}
            {foodPhotos.map((photo, index) => (
              <span key={photo.href}>
                {index > 0 ? " · " : null}
                <a href={photo.href} className="link-fade underline decoration-cream/40 underline-offset-2 hover:text-gold">
                  {photo.credit}
                </a>
              </span>
            ))}
            .
          </p>
        </div>
      </div>
    </footer>
  )
}
