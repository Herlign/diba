import Link from "next/link"
import { Suspense } from "react"
import { FoodImage } from "@/components/food-image"
import { CountUp } from "@/components/home/count-up"
import { DishMarquee } from "@/components/home/dish-marquee"
import { Reveal } from "@/components/home/reveal"
import { ProgrammeCard } from "@/components/programmes/programme-card"
import { ProgrammeListSkeleton } from "@/components/programmes/programme-list"
import { Search } from "lucide-react"
import type { FoodPhoto } from "@/lib/food-photos"
import { getSiteContent, type SiteCopy } from "@/lib/site-content"
import { stepNumber } from "@/lib/site-text"
import { listUpcomingProgrammes } from "@/lib/programmes"

function asPhoto(src: string, alt: string, label: string, focus?: string): FoodPhoto {
  return { src, alt, label, credit: "", href: "", focus: focus || undefined }
}

export default async function HomePage() {
  const content = await getSiteContent()
  return (
    <div>
      <section className="bg-white text-ink">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12 lg:py-16">
          <div className="rise">
            <p className="text-sm font-semibold tracking-wide text-palm uppercase">{content.eyebrow}</p>
            <h1 className="mt-3 max-w-xl font-heading text-4xl leading-[0.98] text-balance sm:text-6xl">
              {content.headlineLead}{" "}
              <span className="bg-gold px-1 text-ink">{content.headlineRest}</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">{content.hero}</p>
            <form action="/programmes" method="get" className="mt-7 flex max-w-lg flex-col gap-2 sm:flex-row">
              <label className="sr-only" htmlFor="find-programme">
                {content.searchLabel}
              </label>
              <div className="flex min-h-12 flex-1 items-center gap-2 rounded-lg border border-border bg-white px-3 text-ink">
                <Search className="size-4 shrink-0 text-palm" aria-hidden="true" />
                <input
                  id="find-programme"
                  name="q"
                  placeholder={content.searchPlaceholder}
                  className="h-12 w-full bg-transparent text-base outline-none placeholder:text-ink/50"
                />
              </div>
              <button
                type="submit"
                className="link-fade inline-flex h-12 items-center justify-center rounded-lg bg-palm px-5 text-sm font-semibold text-cream"
              >
                {content.searchButton}
              </button>
            </form>
            {content.trust.length > 0 ? (
              <ul className="mt-6 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-2">
                {content.trust.map((item) => (
                  <li key={item.id}>{item.label}</li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className={`rise rise-late relative ${content.slipLines.length > 0 ? "mb-36 sm:mb-24" : ""}`}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border-4 border-gold bg-gold shadow-[0_18px_40px_-24px_rgba(12,61,46,0.55)]">
              <FoodImage
                photo={asPhoto(content.heroImageUrl, content.heroImageAlt, content.headlineLead)}
                priority
              />
            </div>
            {content.slipLines.length > 0 ? (
              <div className="absolute -bottom-4 left-3 right-3 rounded-xl bg-gold p-3 text-ink shadow-[0_10px_24px_-16px_rgba(26,18,12,0.45)] sm:right-auto sm:left-4 sm:max-w-xs sm:p-4">
                <p className="text-xs font-semibold tracking-wide uppercase">{content.slipTitle}</p>
                <ul className="mt-2 space-y-1 text-sm font-medium">
                  {content.slipLines.map((row) => (
                    <li key={row.id} className="flex justify-between gap-4">
                      <span>{row.whenLabel}</span>
                      <span>{row.plate}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <DishMarquee labels={content.marquee.map((item) => item.label)} />

      {content.steps.length > 0 ? (
        <section id="how-it-works" className="bg-[#f7f6f3] text-ink">
          <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-3 lg:py-16">
            {content.steps.map((step, index) => (
              <Reveal key={step.id} delay={index * 60}>
                <p className="inline-flex size-10 items-center justify-center rounded-full bg-palm font-heading text-sm text-cream">
                  {stepNumber(index)}
                </p>
                <h2 className="mt-4 font-heading text-3xl leading-tight">{step.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.body}</p>
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      <section className="bg-white text-ink">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
          <Reveal>
            <h2 className="max-w-xl font-heading text-4xl leading-tight text-ink sm:text-5xl">{content.platesHeading}</h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">{content.platesIntro}</p>
          </Reveal>
          {content.showcases.length > 0 ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {content.showcases.map((plate, index) => (
                <Reveal key={plate.id} delay={index * 40}>
                  <article className="overflow-hidden rounded-2xl bg-white text-ink ring-1 ring-foreground/10">
                    <div className="relative aspect-[4/3] bg-muted">
                      <FoodImage photo={asPhoto(plate.imageUrl, plate.imageAlt, plate.name, plate.imageFocus)} />
                    </div>
                    <div className="p-4">
                      <h3 className="font-heading text-2xl text-ink">{plate.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{plate.note}</p>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="bg-[#f7f6f3] text-ink">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-heading text-4xl sm:text-5xl">{content.programmesHeading}</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{content.programmesIntro}</p>
            </div>
            <Link href="/programmes" className="link-fade text-sm font-semibold text-palm">
              {content.programmesLink}
            </Link>
          </div>
          <div className="mt-8">
            <Suspense fallback={<ProgrammeListSkeleton />}>
              <FeaturedProgrammes content={content} />
            </Suspense>
          </div>
        </div>
      </section>

      {content.faqs.length > 0 ? (
        <section id="faq" className="bg-white text-ink">
          <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:py-16">
            <h2 className="font-heading text-4xl">{content.faqHeading}</h2>
            <div className="grid gap-3">
              {content.faqs.map((item) => (
                <details key={item.id} className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
                  <summary className="cursor-pointer text-base font-semibold">{item.question}</summary>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}

async function FeaturedProgrammes({ content }: { content: SiteCopy }) {
  let programmes: Awaited<ReturnType<typeof listUpcomingProgrammes>> | null = null
  let failed = false
  try {
    programmes = await listUpcomingProgrammes()
  } catch {
    failed = true
  }
  if (failed || !programmes) {
    return (
      <div className="rounded-2xl bg-cream px-6 py-10 text-ink">
        <p className="font-heading text-2xl">{content.programmesErrorTitle}</p>
        <p className="mt-2 text-sm text-muted-foreground">{content.programmesErrorBody}</p>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-3 text-ink ring-1 ring-foreground/10 sm:p-5">
        <div>
          <dt className="text-xs font-medium sm:text-sm">{content.statProgrammes}</dt>
          <dd className="font-heading text-3xl text-palm sm:text-5xl">
            <CountUp value={programmes.length} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium sm:text-sm">{content.statChurches}</dt>
          <dd className="font-heading text-3xl text-palm sm:text-5xl">
            <CountUp value={new Set(programmes.map((item) => item.churchName)).size} />
          </dd>
        </div>
      </dl>
      {programmes.length === 0 ? (
        <div className="rounded-2xl bg-cream px-6 py-10 text-ink">
          <p className="font-heading text-2xl">{content.programmesEmptyTitle}</p>
          <p className="mt-2 text-sm text-muted-foreground">{content.programmesEmptyBody}</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {programmes.map((programme) => (
            <ProgrammeCard
              key={programme.slug}
              programme={programme}
              orderLabel={content.orderButton}
              menuSoon={content.menuSoon}
            />
          ))}
        </div>
      )}
    </div>
  )
}
