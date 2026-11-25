import Link from "next/link"
import { Suspense } from "react"
import { FoodImage } from "@/components/food-image"
import { CountUp } from "@/components/home/count-up"
import { DishMarquee } from "@/components/home/dish-marquee"
import { Reveal } from "@/components/home/reveal"
import { ProgrammeCard } from "@/components/programmes/programme-card"
import { ProgrammeListSkeleton } from "@/components/programmes/programme-list"
import { Search } from "lucide-react"
import { MARKETING, ORDER_CUTOFF_HOURS, SERVICE_WINDOWS, serviceWindowSummary } from "@/lib/catalogue"
import { formatClock } from "@/lib/dates"
import { friedRice, grilledChicken, grilledFish, jollof, plantain, yamAndEgg } from "@/lib/food-photos"
import { listUpcomingProgrammes } from "@/lib/programmes"

const steps = [
  {
    number: "01",
    title: "Pick your days",
    body: "Find the programme — by name, or by a code like REBOOT26 — and tick the days you are actually staying.",
  },
  {
    number: "02",
    title: "Choose meals",
    body: "Morning, afternoon, or evening. All-hours plates and extras can go in any slot. You can still change a slot.",
  },
  {
    number: "03",
    title: "We deliver at the venue",
    body: "Your meal is dropped at a designated point inside the programme venue.",
  },
]

const faqs = [
  {
    q: "When does ordering close?",
    a: `Ordering closes ${ORDER_CUTOFF_HOURS} hours before that slot's delivery window starts. Morning (${SERVICE_WINDOWS[0].short}) locks at ${formatClock(SERVICE_WINDOWS[0].start)} the day before, afternoon (${SERVICE_WINDOWS[1].short}) at ${formatClock(SERVICE_WINDOWS[1].start)}, and evening (${SERVICE_WINDOWS[2].short}) at ${formatClock(SERVICE_WINDOWS[2].start)}.`,
  },
  {
    q: "Where do I collect?",
    a: "At a designated collection point inside the programme venue. You choose it at checkout.",
  },
  {
    q: "What about refunds?",
    a: "Cancellations made after payment are generally non-refundable. For payment-related issues or refund enquiries, please contact our support team for assistance.",
  },
  {
    q: "Can I order for a group?",
    a: "Yes. Checkout asks how many people the order feeds, and you can put a family or department name on it.",
  },
]

const plates = [
  { photo: jollof, name: "Diba Party Jollof & Chicken", note: "All hours · from ₦3,850" },
  { photo: yamAndEgg, name: "Boiled yam & egg sauce", note: "With tea or coffee · all hours" },
  { photo: friedRice, name: "Basmati rice & Chicken Delish", note: "All hours · ₦6,500" },
  { photo: grilledChicken, name: "Peppered chicken", note: "An extra for any slot · ₦3,000" },
  { photo: grilledFish, name: "Hake fish", note: "An extra for any slot · from ₦1,500" },
  { photo: plantain, name: "Sweet plantain", note: "An extra for any slot · ₦1,000" },
]

const slip = [
  { when: "Thu breakfast", plate: "Oats & moi-moi" },
  { when: "Fri lunch", plate: "Party jollof" },
  { when: "Sat dinner", plate: "Suya rice" },
]

export default function HomePage() {
  return (
    <div>
      <section className="bg-white text-ink">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12 lg:py-16">
          <div className="rise">
            <p className="text-sm font-semibold tracking-wide text-palm uppercase">{MARKETING.eyebrow}</p>
            <h1 className="mt-3 max-w-xl font-heading text-4xl leading-[0.98] text-balance sm:text-6xl">
              {MARKETING.headlineLead}{" "}
              <span className="bg-gold px-1 text-ink">{MARKETING.headlineRest}</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">{MARKETING.hero}</p>
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
            <ul className="mt-6 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-2">
              <li>Cutoff is {ORDER_CUTOFF_HOURS} hours before</li>
              <li>{serviceWindowSummary()}</li>
              <li>Delivered at the venue</li>
            </ul>
          </div>
          <div className="rise rise-late relative mb-36 sm:mb-24">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border-4 border-gold bg-gold shadow-[0_18px_40px_-24px_rgba(12,61,46,0.55)]">
              <FoodImage photo={jollof} priority />
            </div>
            <div className="absolute -bottom-4 left-3 right-3 rounded-xl bg-gold p-3 text-ink shadow-[0_10px_24px_-16px_rgba(26,18,12,0.45)] sm:right-auto sm:left-4 sm:max-w-xs sm:p-4">
              <p className="text-xs font-semibold tracking-wide uppercase">Reboot Camp · Surulere</p>
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
            <h2 className="max-w-xl font-heading text-4xl leading-tight text-ink sm:text-5xl">Freshly prepared</h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
              Choose a slot, choose a plate, and collect it at a designated point inside the venue. Extras can be added to any slot.
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
