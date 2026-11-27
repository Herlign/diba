import { Logo } from "@/components/layout/logo"

export function SiteFooter({
  footer,
  footerNote,
  footerStaff,
  footerWhatsapp,
  whatsappHref,
  photoCredit,
  logoUrl,
  logoAlt,
}: {
  footer: string
  footerNote: string
  footerStaff: string
  footerWhatsapp: string
  whatsappHref: string
  photoCredit: string
  logoUrl: string | null
  logoAlt: string
}) {
  return (
    <footer className="mt-auto border-t border-border bg-white text-ink">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-md space-y-3">
            <Logo src={logoUrl} alt={logoAlt} />
            <p className="text-sm leading-6 text-muted-foreground">{footer}</p>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>{footerNote}</p>
            <a href="/admin/login" className="link-fade mt-2 inline-flex h-11 items-center font-semibold text-palm">
              {footerStaff}
            </a>
            <a href={whatsappHref} className="link-fade mt-2 inline-flex h-11 items-center font-semibold text-palm">
              {footerWhatsapp}
            </a>
          </div>
        </div>
        {photoCredit ? (
          <div className="border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
            <p>{photoCredit}</p>
          </div>
        ) : null}
      </div>
    </footer>
  )
}
