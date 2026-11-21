import Link from "next/link"
import { Suspense } from "react"
import { FoodImage } from "@/components/food-image"
import { CountUp } from "@/components/home/count-up"
import { DishMarquee } from "@/components/home/dish-marquee"
import { Reveal } from "@/components/home/reveal"
import { ProgrammeCard } from "@/components/programmes/programme-card"
import { ProgrammeListSkeleton } from "@/components/programmes/programme-list"
import { egusi, friedRice, grilledChicken, grilledFish, jollof, plantain } from "@/lib/food-photos"
import { catalogueStats, listFeaturedProgrammes } from "@/lib/programmes"

const steps = [
  {
    number: "01",
    title: "Your church opens the pot",
    body: "They send the dates, the blocks, and how many people are actually coming. We don't guess from last year's crusade.",
  },
  {
    number: "02",
    title: "You pick every sitting",
    body: "Jollof on Friday, egusi on Saturday, something calmer for the children. One list covers the whole weekend.",
  },
  {
    number: "03",
    title: "We call your block",
    body: "The pack has your name on it. When the session ends, you collect it and go back in. No buffet scrum.",
  },
]

const plates = [
  { photo: plantain, name: "Sweet plantain", note: "Fried while the sermon is still going." },
  { photo: friedRice, name: "Fried rice & pepper", note: "The one people hide under their chair." },
  { photo: egusi, name: "Egusi stew", note: "Saturday swallow, not a polite spoonful." },
  { photo: grilledChicken, name: "Grilled chicken", note: "Charred skin, lean meat, no bone argument." },
  { photo: grilledFish, name: "Peppered fish", note: "For the people who don't do red meat." },
  { photo: jollof, name: "Party jollof", note: "Smoky, and it still tastes like a party in the pack." },
]

const slip = [
  { when: "Friday dinner", plate: "Party jollof" },
  { when: "Saturday lunch", plate: "Pounded yam & egusi" },
  { when: "Sunday lunch", plate: "Ofada & ayamase" },
]

export default function HomePage() {
  return (
    <div>
      <section className="bg-palm text-cream">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12 lg:py-16">
          <div className="rise">
            <p className="text-sm font-semibold tracking-wide text-gold uppercase">
              Lagos & Ile-Ife kitchens · church programmes
            </p>
            <h1 className="mt-3 max-w-xl font-heading text-4xl leading-[0.98] text-balance sm:text-6xl">
              Benediction dropped. Your <span className="bg-gold px-1 text-ink">jollof</span> is already at Block B.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-cream/85 sm:text-lg">
              We cook the whole programme in one go. Friday night rice, Saturday swallow, Sunday lunch — labelled, packed, and waiting where you sit. No queue. No &quot;who took my chicken?&quot;
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/programmes"
                className="link-fade inline-flex h-12 items-center rounded-lg bg-gold px-5 text-sm font-semibold text-ink"
              >
                See open programmes
              </Link>
              <a href="#how-it-works" className="link-fade text-sm font-semibold text-cream underline decoration-gold decoration-2 underline-offset-4">
                How we feed a church
              </a>
            </div>
            <ul className="mt-8 flex flex-col gap-2 text-sm text-cream/80 sm:flex-row sm:gap-5">
              <li>Locks at 6pm the day before</li>
              <li>Your name on the pack</li>
              <li>Packs from ₦6,500</li>
            </ul>
          </div>
          <div className="rise rise-late relative mb-36 sm:mb-24">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border-4 border-gold bg-gold shadow-[8px_8px_0_0_#f26b21] sm:shadow-[12px_12px_0_0_#f26b21]">
              <FoodImage photo={jollof} priority />
            </div>
            <div className="absolute -bottom-4 left-3 right-3 rounded-xl bg-gold p-3 text-ink shadow-[4px_4px_0_0_#c81d25] sm:right-auto sm:left-4 sm:max-w-xs sm:p-4">
              <p className="text-xs font-semibold tracking-wide uppercase">Greater Light · Ikeja</p>
              <ul className="mt-2 space-y-1 text-sm font-medium">
                {slip.map((row) => (
                  <li key={row.when} className="flex justify-between gap-4">
                    <span>{row.when}</span>
                    <span>{row.plate}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <DishMarquee />

      <section id="how-it-works" className="bg-tomato text-cream">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-3 lg:py-16">
          {steps.map((step, index) => (
            <Reveal key={step.number} delay={index * 60}>
              <p className="inline-flex size-10 items-center justify-center rounded-full bg-gold font-heading text-sm text-ink">
                {step.number}
              </p>
              <h2 className="mt-4 font-heading text-3xl leading-tight">{step.title}</h2>
              <p className="mt-2 text-sm leading-6 text-cream/85">{step.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-[linear-gradient(160deg,#f26b21_0%,#e23b2f_100%)] text-cream">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
          <Reveal>
            <h2 className="max-w-xl font-heading text-4xl leading-tight sm:text-5xl">
              What the kitchen is actually proud of
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-cream/90">
              Complete plates. Not a scoop-and-pray buffet, and not rice that went cold while the choir did the third chorus.
            </p>
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plates.map((plate, index) => (
              <Reveal key={plate.name} delay={index * 40}>
                <article className="overflow-hidden rounded-2xl bg-ink text-cream shadow-[0_10px_0_0_#1a120c]">
                  <div className="relative aspect-[4/3] bg-gold">
                    <FoodImage photo={plate.photo} />
                  </div>
                  <div className="p-4">
                    <h3 className="font-heading text-2xl">{plate.name}</h3>
                    <p className="mt-1 text-sm text-cream/75">{plate.note}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-palm text-cream">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-heading text-4xl sm:text-5xl">Open this week</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-cream/80">
                6pm the day before, the list locks. Don&apos;t be the person negotiating with the usher.
              </p>
            </div>
            <Link href="/programmes?status=open" className="link-fade text-sm font-semibold text-gold">
              All programmes
            </Link>
          </div>
          <div className="mt-8">
            <Suspense fallback={<ProgrammeListSkeleton />}>
              <FeaturedProgrammes />
            </Suspense>
          </div>
        </div>
      </section>
    </div>
  )
}

async function FeaturedProgrammes() {
  let programmes: Awaited<ReturnType<typeof listFeaturedProgrammes>> | null = null
  let stats: Awaited<ReturnType<typeof catalogueStats>> | null = null
  let failed = false
  try {
    const result = await Promise.all([listFeaturedProgrammes(), catalogueStats()])
    programmes = result[0]
    stats = result[1]
  } catch {
    failed = true
  }
  if (failed || !programmes || !stats) {
    return (
      <div className="rounded-2xl bg-cream px-6 py-10 text-ink">
        <p className="font-heading text-2xl">The board didn&apos;t load</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Give it a second and refresh. A fresh checkout still needs the database seeded.
        </p>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-3 gap-2 rounded-2xl bg-gold p-3 text-ink sm:p-5">
        <div>
          <dt className="text-xs font-medium sm:text-sm">Programmes</dt>
          <dd className="font-heading text-3xl sm:text-5xl">
            <CountUp value={stats.programmes} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium sm:text-sm">Cities</dt>
          <dd className="font-heading text-3xl sm:text-5xl">
            <CountUp value={stats.cities} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium sm:text-sm">Plates</dt>
          <dd className="font-heading text-3xl sm:text-5xl">
            <CountUp value={stats.plates} />
          </dd>
        </div>
      </dl>
      {programmes.length === 0 ? (
        <div className="rounded-2xl bg-cream px-6 py-10 text-ink">
          <p className="font-heading text-2xl">Nothing is open today</p>
          <p className="mt-2 text-sm text-muted-foreground">
            The announced programmes are still on the full list.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {programmes.map((programme) => (
            <ProgrammeCard key={programme.slug} programme={programme} />
          ))}
        </div>
      )}
    </div>
  )
}
