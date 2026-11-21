import { Logo } from "@/components/layout/logo"
import { foodPhotos } from "@/lib/food-photos"

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-white text-ink">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-md space-y-3">
            <Logo />
            <p className="text-sm leading-6 text-muted-foreground">
              Cooked in Lagos and Ile-Ife. Packed with your name on it, and dropped at the church — not at a random junction.
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>Orders close 24 hours before each meal.</p>
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_E164 ?? "2348090002210"}`}
              className="link-fade mt-2 inline-flex h-11 items-center font-semibold text-palm"
            >
              WhatsApp support
            </a>
          </div>
        </div>
        <div className="border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
          <p>
            Food photos, free to use, from Pexels:{" "}
            {foodPhotos.map((photo, index) => (
              <span key={photo.href}>
                {index > 0 ? " · " : null}
                <a href={photo.href} className="link-fade underline decoration-border underline-offset-2 hover:text-palm">
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
