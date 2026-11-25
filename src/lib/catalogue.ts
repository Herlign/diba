/** Hours before a slot's delivery window when ordering closes. */
export const ORDER_CUTOFF_HOURS = 24

/** Seats created with a new slot. A later content run does not overwrite an edited capacity. */
export const DEFAULT_SLOT_CAPACITY = 300

export const VARIANT_NAME = "Regular"

/** Suggested portion labels. Saved as variant names, so staff can rename them. */
export const SUGGESTED_PORTION_LABELS = ["Regular", "Large"] as const

/** Africa/Lagos windows. Breakfast is morning, lunch is afternoon, dinner is evening. */
export const SERVICE_WINDOWS = [
  { key: "morning", name: "Morning", start: "07:00", end: "10:00", short: "7–10am", position: 0 },
  { key: "afternoon", name: "Afternoon", start: "13:00", end: "15:00", short: "1–3pm", position: 1 },
  { key: "evening", name: "Evening", start: "18:00", end: "20:00", short: "6–8pm", position: 2 },
] as const

export type WindowKey = (typeof SERVICE_WINDOWS)[number]["key"]

export const MENU_CATEGORIES = [
  { slug: "breakfast", name: "Breakfast", position: 0 },
  { slug: "lunch", name: "Lunch", position: 1 },
  { slug: "dinner", name: "Dinner", position: 2 },
  { slug: "extras", name: "Extras", position: 3 },
] as const

export type MenuCategorySlug = (typeof MENU_CATEGORIES)[number]["slug"]

/** Plates that count toward a programme's "from" price. Extras are add-ons, so a ₦500 egg does not set it. */
export const MAIN_MEAL_CATEGORY_SLUGS = ["breakfast", "lunch", "dinner"] as const

export const MARKETING = {
  headlineLead: "Never miss a meal.",
  headlineRest: "Never miss a moment",
  hero: "From early morning sessions to evening conventions, enjoy freshly prepared, satisfying meals without the long walks, endless queues or stress of figuring out where to eat. Simply choose your meals, select your preferred slots, and let Diba take care of the rest with convenient delivery to designated points within your programme venue.",
  footer: "Freshly prepared meals, delivered to designated points within your programme venue.",
  eyebrow: "Freshly prepared · delivered at the venue",
} as const

export function serviceWindowSummary() {
  return SERVICE_WINDOWS.map((window) => `${window.name} ${window.short}`).join(" · ")
}

type Availability = WindowKey | "all"

export type CatalogueVariant = {
  name: string
  priceKobo: number
  position?: number
}

export type CatalogueItem = {
  slug: string
  name: string
  description: string
  imageUrl: string
  category: MenuCategorySlug
  tags: string[]
  /** Single-portion price. With `variants`, this is the Regular / from price. */
  priceKobo: number
  /** Omitted means one portion named Regular at priceKobo. */
  variants?: CatalogueVariant[]
  availability: Availability
}

export type CataloguePortion = {
  name: string
  priceKobo: number
  position: number
}

/** One Regular portion when an item has no size list. */
export function portionsFor(item: CatalogueItem): CataloguePortion[] {
  if (!item.variants || item.variants.length === 0) {
    return [{ name: VARIANT_NAME, priceKobo: item.priceKobo, position: 0 }]
  }
  return item.variants.map((variant, index) => ({
    name: variant.name,
    priceKobo: variant.priceKobo,
    position: variant.position ?? index,
  }))
}

function kobo(naira: number) {
  return naira * 100
}

function plate(name: string, extra: string) {
  return extra ? `${name} ${extra}` : name
}

const everySlot = "Available in every slot."

export const MENU_ITEMS: CatalogueItem[] = [
  {
    slug: "oats-moi-moi",
    name: "Oats & Moi-Moi",
    description: "Oats served with moi-moi.",
    imageUrl: "/images/plantain.jpg",
    category: "breakfast",
    tags: [],
    priceKobo: kobo(3000),
    availability: "morning",
  },
  {
    slug: "pap-custard-moi-moi",
    name: "Pap/Custard & Moi-Moi",
    description: "Pap or custard served with moi-moi.",
    imageUrl: "/images/plantain.jpg",
    category: "breakfast",
    tags: [],
    priceKobo: kobo(3000),
    availability: "morning",
  },
  {
    slug: "boiled-plantain-egg-sauce",
    name: "Boiled plantain & egg sauce + tea",
    description: "Boiled plantain with egg sauce and tea.",
    imageUrl: "/images/plantain.jpg",
    category: "breakfast",
    tags: [],
    priceKobo: kobo(3500),
    availability: "morning",
  },
  {
    slug: "yamarita",
    name: "Yamarita, pepper sauce + tea/coffee",
    description: "Yamarita with pepper sauce, and tea or coffee.",
    imageUrl: "/images/yam-egg.jpg",
    category: "breakfast",
    tags: [],
    priceKobo: kobo(4500),
    availability: "morning",
  },
  {
    slug: "boiled-white-rice-plantain-beef",
    name: "Boiled white rice + plantain + beef, egg & ponmo",
    description: plate("Boiled white rice with plantain, beef, egg and ponmo.", everySlot),
    imageUrl: "/images/jollof.jpg",
    category: "breakfast",
    tags: [],
    priceKobo: kobo(3450),
    availability: "all",
  },
  {
    slug: "beans-plantain-eja-kika",
    name: "Beans & plantain + eja kika",
    description: "Beans and plantain with eja kika.",
    imageUrl: "/images/plantain.jpg",
    category: "lunch",
    tags: [],
    priceKobo: kobo(4200),
    availability: "afternoon",
  },
  {
    slug: "rice-beans-plantain",
    name: "Rice & beans + plantain, beef and egg",
    description: "Rice and beans with plantain, beef and egg.",
    imageUrl: "/images/jollof-platter.jpg",
    category: "lunch",
    tags: [],
    priceKobo: kobo(4500),
    availability: "afternoon",
  },
  {
    slug: "diba-party-jollof-chicken",
    name: "Diba Party Jollof & Chicken",
    description: plate("Party jollof with chicken.", everySlot),
    imageUrl: "/images/jollof.jpg",
    category: "lunch",
    tags: [],
    // No catalogue row is named "Jollof rice", so the ₦3,850 / ₦5,000 sizes are not applied here.
    priceKobo: kobo(5000),
    availability: "all",
  },
  {
    slug: "white-rice-ayamase",
    name: "Boiled white rice & Ayamase sauce (beef, egg, ponmo)",
    description: "Boiled white rice with ayamase sauce, beef, egg and ponmo.",
    imageUrl: "/images/jollof.jpg",
    category: "lunch",
    tags: ["spicy"],
    priceKobo: kobo(4550),
    availability: "afternoon",
  },
  {
    slug: "stir-fry-pasta-turkey",
    name: "Stir-fry pasta, plantain & turkey",
    description: "Stir-fried pasta with plantain and turkey.",
    imageUrl: "/images/jollof-platter.jpg",
    category: "lunch",
    tags: [],
    priceKobo: kobo(6000),
    availability: "afternoon",
  },
  {
    slug: "suya-rice-peppered-chicken",
    name: "Suya rice & peppered chicken",
    description: "Suya rice with peppered chicken.",
    imageUrl: "/images/grilled-chicken.jpg",
    category: "dinner",
    tags: ["spicy"],
    priceKobo: kobo(5000),
    availability: "evening",
  },
  {
    slug: "chicken-shawarma-wrap",
    name: "Chicken shawarma wrap",
    description: "Chicken shawarma in a wrap.",
    imageUrl: "/images/grilled-chicken.jpg",
    category: "dinner",
    tags: [],
    priceKobo: kobo(4500),
    availability: "evening",
  },
  {
    slug: "basmati-chicken-delish",
    name: "Basmati rice + Chicken Delish sauce",
    description: plate("Basmati rice with Chicken Delish sauce.", everySlot),
    imageUrl: "/images/jollof-platter.jpg",
    category: "dinner",
    tags: [],
    priceKobo: kobo(6500),
    availability: "all",
  },
  {
    slug: "boiled-yam-egg-sauce",
    name: "Boiled yam & egg sauce + tea/coffee",
    description: plate("Boiled yam with egg sauce, and tea or coffee.", everySlot),
    imageUrl: "/images/yam-egg.jpg",
    category: "dinner",
    tags: [],
    priceKobo: kobo(4000),
    availability: "all",
  },
  {
    slug: "ofada-ayamase",
    name: "Ofada rice & Ayamase sauce (beef, egg, ponmo)",
    description: "Ofada rice with ayamase sauce, beef, egg and ponmo.",
    imageUrl: "/images/jollof.jpg",
    category: "dinner",
    tags: ["spicy"],
    priceKobo: kobo(5000),
    availability: "evening",
  },
  {
    slug: "hake-fish",
    name: "Hake fish",
    description: plate("Hake fish add-on.", everySlot),
    imageUrl: "/images/grilled-fish.jpg",
    category: "extras",
    tags: [],
    priceKobo: kobo(1500),
    variants: [
      { name: "Regular", priceKobo: kobo(1500), position: 0 },
      { name: "Large", priceKobo: kobo(2500), position: 1 },
    ],
    availability: "all",
  },
  {
    slug: "peppered-chicken",
    name: "Peppered chicken",
    description: plate("Peppered chicken add-on.", everySlot),
    imageUrl: "/images/grilled-chicken.jpg",
    category: "extras",
    tags: ["spicy"],
    priceKobo: kobo(3000),
    availability: "all",
  },
  {
    slug: "panla-fish",
    name: "Panla fish",
    description: plate("Panla fish add-on.", everySlot),
    imageUrl: "/images/grilled-fish.jpg",
    category: "extras",
    tags: [],
    priceKobo: kobo(2000),
    availability: "all",
  },
  {
    slug: "fried-beef",
    name: "Fried beef",
    description: plate("Fried beef add-on.", everySlot),
    imageUrl: "/images/grilled-chicken.jpg",
    category: "extras",
    tags: [],
    priceKobo: kobo(1000),
    availability: "all",
  },
  {
    slug: "boiled-egg",
    name: "Boiled egg",
    description: plate("Boiled egg add-on.", everySlot),
    imageUrl: "/images/yam-egg.jpg",
    category: "extras",
    tags: [],
    priceKobo: kobo(500),
    availability: "all",
  },
  {
    slug: "sweet-plantain",
    name: "Sweet plantain",
    description: plate("Sweet plantain add-on.", everySlot),
    imageUrl: "/images/plantain.jpg",
    category: "extras",
    tags: ["vegetarian"],
    priceKobo: kobo(1000),
    availability: "all",
  },
  {
    slug: "tofu",
    name: "Tofu",
    description: plate("Tofu add-on.", everySlot),
    imageUrl: "/images/plantain.jpg",
    category: "extras",
    tags: ["vegetarian"],
    priceKobo: kobo(2000),
    availability: "all",
  },
]

export function periodsFor(item: CatalogueItem) {
  if (item.availability === "all") return SERVICE_WINDOWS.map((window) => window.name)
  const match = SERVICE_WINDOWS.find((window) => window.key === item.availability)
  return match ? [match.name] : []
}

const PLACEHOLDER_CONTACT = {
  contactPhone: "+2348090002210",
  contactEmail: "programmes@dibameals.test",
}

const COLLECTION_POINT = {
  pointName: "Designated collection point",
  pointDescription: "Collect at the point named for this programme.",
  notes: "Delivered to a designated point inside the venue.",
}

export type CatalogueProgramme = {
  code: string
  slug: string
  title: string
  description: string
  coverImageUrl: string
  startDate: string
  endDate: string
  church: { slug: string; name: string; contactPhone: string; contactEmail: string }
  venue: {
    key: string
    name: string
    address: string
    notes: string
    pointName: string
    pointDescription: string
  }
}

export const PROGRAMMES: CatalogueProgramme[] = [
  {
    code: "REBOOT26",
    slug: "reboot-camp-2026",
    title: "Reboot Camp",
    description: "Reboot Camp runs from 3–6 December 2026 at the National Stadium, Surulere, Lagos.",
    coverImageUrl: "/images/jollof.jpg",
    startDate: "2026-12-03",
    endDate: "2026-12-06",
    church: { slug: "reboot-camp", name: "Reboot Camp", ...PLACEHOLDER_CONTACT },
    venue: {
      key: "diba:national-stadium-surulere",
      name: "National Stadium, Surulere",
      address: "National Stadium, Surulere, Lagos",
      ...COLLECTION_POINT,
    },
  },
  {
    code: "HGC26",
    slug: "rccg-holy-ghost-congress-2026",
    title: "RCCG Holy Ghost Congress 2026",
    description:
      'The RCCG Holy Ghost Congress 2026 takes place from 7–12 December 2026 at Redemption City (KM 46, Lagos–Ibadan Expressway, Ogun State, Nigeria) under the theme "The Lord of Hosts".',
    coverImageUrl: "/images/jollof-platter.jpg",
    startDate: "2026-12-07",
    endDate: "2026-12-12",
    church: { slug: "rccg", name: "RCCG", ...PLACEHOLDER_CONTACT },
    venue: {
      key: "diba:redemption-city",
      name: "Redemption City",
      address: "KM 46, Lagos–Ibadan Expressway, Ogun State, Nigeria",
      ...COLLECTION_POINT,
    },
  },
  {
    code: "FEAST26",
    slug: "the-feast-2026",
    title: "The Feast 2026: The Torch",
    description:
      "The Feast 2026 (themed The Torch) is the annual three-day spiritual convocation hosted by The New Church (led by Global Lead Pastor Shola Okodugha) from 11–13 December 2026. Meals are delivered at The New Fusion Centre, 60A Surulere Industrial Road, Ogba, Ikeja 101233, Lagos.",
    coverImageUrl: "/images/yam-egg.jpg",
    startDate: "2026-12-11",
    endDate: "2026-12-13",
    church: { slug: "the-new-church", name: "The New Church", ...PLACEHOLDER_CONTACT },
    venue: {
      key: "diba:new-fusion-centre",
      name: "The New Fusion Centre",
      address: "60A Surulere Industrial Road, Ogba, Ikeja 101233, Lagos",
      ...COLLECTION_POINT,
    },
  },
]

export const PROGRAMME_CODES = PROGRAMMES.map((programme) => programme.code)
