import Link from "next/link"

export function Logo() {
  return (
    <Link href="/" className="link-fade flex items-center gap-2.5 text-ink">
      <svg aria-hidden="true" viewBox="0 0 32 32" className="size-8">
        <rect width="32" height="32" rx="9" fill="#f5b301" />
        <circle cx="16" cy="16" r="8" fill="none" stroke="#0c3d2e" strokeWidth="1.8" />
        <circle cx="16" cy="16" r="2.6" fill="#c81d25" />
      </svg>
      <span className="font-heading text-lg leading-none tracking-tight">
        Diba <span className="text-[#6a4b00]">Meals</span>
      </span>
    </Link>
  )
}
