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
  src,
  alt = "Diba Meals",
}: {
  href?: string
  className?: string
  tone?: keyof typeof MARK
  priority?: boolean
  src?: string | null
  alt?: string
}) {
  return (
    <Link href={href} className="link-fade inline-flex shrink-0 items-center">
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={320}
          height={64}
          priority={priority}
          className={className}
          style={{ width: "auto", height: "3rem" }}
        />
      ) : (
        <Image src={MARK[tone]} alt={alt} width={376} height={410} priority={priority} className={className} />
      )}
    </Link>
  )
}
