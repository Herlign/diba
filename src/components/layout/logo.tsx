import Image from "next/image"
import Link from "next/link"

const MARK = {
  ink: "/brand/diba-wordmark.svg",
  gold: "/brand/diba-wordmark-gold.svg",
} as const

export function Logo({
  href = "/",
  className = "h-12 w-auto",
  tone = "ink",
  priority = false,
}: {
  href?: string
  className?: string
  tone?: keyof typeof MARK
  priority?: boolean
}) {
  return (
    <Link href={href} className="link-fade inline-flex shrink-0 items-center">
      <Image
        src={MARK[tone]}
        alt="Diba Meals"
        width={376}
        height={410}
        priority={priority}
        className={className}
      />
    </Link>
  )
}
