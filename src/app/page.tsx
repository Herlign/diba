import Link from "next/link"
import { Suspense } from "react"
import { FoodImage } from "@/components/food-image"
import { CountUp } from "@/components/home/count-up"
import { DishMarquee } from "@/components/home/dish-marquee"
import { Reveal } from "@/components/home/reveal"
import { ProgrammeCard } from "@/components/programmes/programme-card"
import { ProgrammeListSkeleton } from "@/components/programmes/programme-list"
import { Search } from "lucide-react"
import { egusi, friedRice, grilledChicken, grilledFish, jollof, plantain } from "@/lib/food-photos"
import { listUpcomingProgrammes } from "@/lib/programmes"

const steps = [
  {
    number: "01",
    title: "Pick your days",
    body: "Find the programme your church shared — by name, or by a code like CROSS26 — and tick the days you are actually staying.",
  },
  {
    number: "02",
    title: "Choose meals",
    body: "Morning, evening, or a plan that fills the week. Same breakfast every day is one tap. You can still change a slot.",
  },
  {
    number: "03",
    title: "We deliver at the venue",
    body: "Your pack meets you at Gate A, the hostel, or children's church. No queue outside the camp.",
  },
]

const faqs = [
  {
    q: "When does ordering close?",
    a: "24 hours before that meal's delivery window starts. For a 7:00am breakfast, the list locks at 7:00am the day before.",
  },
  {
    q: "Where do I collect?",
    a: "At a delivery point inside the venue — the auditorium gate, a hostel block, or the children's hall. You choose it at checkout.",
  },
  {
    q: "What about refunds?",
    a: "A slot still before its cutoff can be cancelled. That raises a refund request for the church team. The MVP does not refund automatically.",
  },
  {
    q: "Can I order for a group?",
    a: "Yes. Checkout asks how many people the order feeds, and you can put a family or department name on it.",
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
      <section className="bg-white text-ink">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12 lg:py-16">
          <div className="rise">
            <p className="text-sm font-semibold tracking-wide text-palm uppercase">
              Lagos & Ile-Ife kitchens · church programmes
            </p>
            <h1 className="mt-3 max-w-xl font-heading text-4xl leading-[0.98] text-balance sm:text-6xl">
              Your meals, sorted for the <span className="bg-gold px-1 text-ink">whole programme</span>.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
              Conventions, crossovers, retreats. Pick your days, choose morning and evening plates, and we bring them to your block. No queue on the expressway.
            </p>
            <form action="/programmes" method="get" className="mt-7 flex max-w-lg flex-col gap-2 sm:flex-row">
              <label className="sr-only" htmlFor="find-programme">
                Find your programme
              </label>
              <div className="flex min-h-12 flex-1 items-center gap-2 rounded-lg border border-border bg-white px-3 text-ink">
                <Search className="size-4 shrink-0 text-palm" aria-hidden="true" />
                <input
                  id="find-programme"
                  name="q"
                  placeholder="Find your programme — church, name or code"
                  className="h-12 w-full bg-transparent text-base outline-none placeholder:text-ink/50"
                />
              </div>
              <button
                type="submit"
                className="link-fade inline-flex h-12 items-center justify-center rounded-lg bg-palm px-5 text-sm font-semibold text-cream"
              >
                Search
              </button>
            </form>
            <ul className="mt-6 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:gap-5">
              <li>Cutoff is 24 hours before</li>
              <li>Morning 7–9am · Evening 6–8pm</li>
              <li>Delivered at the venue</li>
            </ul>
          </div>
          <div className="rise rise-late relative mb-36 sm:mb-24">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border-4 border-gold bg-gold shadow-[0_18px_40px_-24px_rgba(12,61,46,0.55)]">
              <FoodImage photo={jollof} priority />
            </div>
            <div className="absolute -bottom-4 left-3 right-3 rounded-xl bg-gold p-3 text-ink shadow-[0_10px_24px_-16px_rgba(26,18,12,0.45)] sm:right-auto sm:left-4 sm:max-w-xs sm:p-4">
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

      <section id="how-it-works" className="bg-[#f7f6f3] text-ink">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-3 lg:py-16">
          {steps.map((step, index) => (
            <Reveal key={step.number} delay={index * 60}>
              <p className="inline-flex size-10 items-center justify-center rounded-full bg-palm font-heading text-sm text-cream">
                {step.number}
              </p>
              <h2 className="mt-4 font-heading text-3xl leading-tight">{step.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-white text-ink">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
          <Reveal>
            <h2 className="max-w-xl font-heading text-4xl leading-tight text-ink sm:text-5xl">
              What the kitchen is actually proud of
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
              Complete plates. Not a scoop-and-pray buffet, and not rice that went cold while the choir did the third chorus.
            </p>
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plates.map((plate, index) => (
              <Reveal key={plate.name} delay={index * 40}>
                <article className="overflow-hidden rounded-2xl bg-white text-ink ring-1 ring-foreground/10">
                  <div className="relative aspect-[4/3] bg-muted">
                    <FoodImage photo={plate.photo} />
                  </div>
                  <div className="p-4">
                    <h3 className="font-heading text-2xl text-ink">{plate.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{plate.note}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f7f6f3] text-ink">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-heading text-4xl sm:text-5xl">Upcoming programmes</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Published programmes only. Drafts stay in the office until the church is ready.
              </p>
            </div>
            <Link href="/programmes" className="link-fade text-sm font-semibold text-palm">
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

      <section id="faq" className="bg-white text-ink">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:py-16">
          <h2 className="font-heading text-4xl">Before you order</h2>
          <div className="grid gap-3">
            {faqs.map((item) => (
              <details key={item.q} className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
                <summary className="cursor-pointer text-base font-semibold">{item.q}</summary>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

async function FeaturedProgrammes() {
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
        <p className="font-heading text-2xl">The board didn&apos;t load</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Give it a second and refresh. A fresh checkout still needs the database seeded.
        </p>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-3 text-ink ring-1 ring-foreground/10 sm:p-5">
        <div>
          <dt className="text-xs font-medium sm:text-sm">Programmes</dt>
          <dd className="font-heading text-3xl text-palm sm:text-5xl">
            <CountUp value={programmes.length} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium sm:text-sm">Churches</dt>
          <dd className="font-heading text-3xl text-palm sm:text-5xl">
            <CountUp value={new Set(programmes.map((item) => item.churchName)).size} />
          </dd>
        </div>
      </dl>
      {programmes.length === 0 ? (
        <div className="rounded-2xl bg-cream px-6 py-10 text-ink">
          <p className="font-heading text-2xl">Nothing is published yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            When a church opens a programme, it will land here.
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
