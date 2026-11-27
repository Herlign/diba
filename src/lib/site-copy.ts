import { MARKETING, ORDER_CUTOFF_HOURS, SERVICE_WINDOWS, serviceWindowSummary } from "@/lib/catalogue"
import { formatClock } from "@/lib/dates"
import { friedRice, foodPhotos, grilledChicken, grilledFish, jollof, plantain, yamAndEgg } from "@/lib/food-photos"

const [morning, afternoon, evening] = SERVICE_WINDOWS

/** Shown under the footer while the stock photos are still in use. */
export const DEFAULT_PHOTO_CREDIT = `Food photos, free to use, from Pexels: ${foodPhotos.map((photo) => photo.credit).join(" · ")}.`

/**
 * Public copy used when the database row is missing.
 * These strings match the site before it was editable. A later edit in production is not copied here.
 */
export const DEFAULT_SITE_CONTENT = {
  eyebrow: MARKETING.eyebrow,
  headlineLead: MARKETING.headlineLead,
  headlineRest: MARKETING.headlineRest,
  hero: MARKETING.hero,
  footer: MARKETING.footer,
  searchLabel: "Find your programme",
  searchPlaceholder: "Find your programme — church, name or code",
  searchButton: "Search",
  heroImageUrl: jollof.src,
  heroImageAlt: jollof.alt,
  slipTitle: "Reboot Camp · Surulere",
  platesHeading: "Freshly prepared",
  platesIntro: "Choose a slot, choose a plate, and collect it at a designated point inside the venue. Extras can be added to any slot.",
  programmesHeading: "Upcoming programmes",
  programmesIntro: "Published programmes only. Drafts stay in the office until the church is ready.",
  programmesLink: "All programmes",
  statProgrammes: "Programmes",
  statChurches: "Churches",
  programmesEmptyTitle: "Nothing is published yet",
  programmesEmptyBody: "When a church opens a programme, it will land here.",
  programmesErrorTitle: "The board didn't load",
  programmesErrorBody: "Give it a second and refresh. A fresh checkout still needs the database seeded.",
  faqHeading: "Before you order",
  navProgrammes: "Programmes",
  navOrders: "My orders",
  navCta: "Open lists",
  logoAlt: "Diba Meals",
  footerNote: `Orders close ${ORDER_CUTOFF_HOURS} hours before each slot.`,
  footerStaff: "Staff",
  footerWhatsapp: "WhatsApp support",
  whatsappE164: "",
  photoCredit: DEFAULT_PHOTO_CREDIT,
  boardEyebrow: "The board",
  boardTitle: "Find your programme",
  boardIntro: "Search by church, programme name, or the code on the poster. Ordering closes 24 hours before each slot.",
  boardPlaceholder: "Church, programme name, or code",
  boardSearch: "Search",
  boardClear: "Clear",
  boardEmptyTitle: "No programme matches that",
  boardEmptyBody: "Try the code on the church poster, or clear the search.",
  boardMetaDescription: "Find a church programme by name or code and see where Diba Meals is delivering.",
  boardShareDescription: "Camps, congresses and convocations taking meal orders.",
  orderButton: "Order meals",
  menuSoon: "Menu soon",
  missingEyebrow: "Missing page",
  missingTitle: "That page is not on the menu",
  missingBody: "The link may be old. The programme list is the place to start.",
  missingButton: "Browse programmes",
  ordersEyebrow: "My orders",
  ordersTitle: "Find the meals you booked",
  ordersBody: "Use the email from checkout. We'll send a link that opens every order on that address. It lasts 2 hours.",
  ordersEmailLabel: "Email",
  ordersButton: "Email me a link",
  ordersSending: "Sending…",
  siteName: "Diba Meals",
  socialExtra: "Morning, afternoon and evening, delivered at the programme venue.",
  ogImageAlt: "Diba Meals",
}

export const DEFAULT_FAQS = [
  {
    id: "faq-ordering-closes",
    question: "When does ordering close?",
    answer: `Ordering closes ${ORDER_CUTOFF_HOURS} hours before that slot's delivery window starts. Morning (${morning.short}) locks at ${formatClock(morning.start)} the day before, afternoon (${afternoon.short}) at ${formatClock(afternoon.start)}, and evening (${evening.short}) at ${formatClock(evening.start)}.`,
  },
  {
    id: "faq-where-to-collect",
    question: "Where do I collect?",
    answer: "At a designated collection point inside the programme venue. You choose it at checkout.",
  },
  {
    id: "faq-refunds",
    question: "What about refunds?",
    answer:
      "Cancellations made after payment are generally non-refundable. For payment-related issues or refund enquiries, please contact our support team for assistance.",
  },
  {
    id: "faq-group-order",
    question: "Can I order for a group?",
    answer: "Yes. Checkout asks how many people the order feeds, and you can put a family or department name on it.",
  },
] as const

export const DEFAULT_STEPS = [
  {
    id: "step-pick-days",
    title: "Pick your days",
    body: "Find the programme — by name, or by a code like REBOOT26 — and tick the days you are actually staying.",
  },
  {
    id: "step-choose-meals",
    title: "Choose meals",
    body: "Morning, afternoon, or evening. All-hours plates and extras can go in any slot. You can still change a slot.",
  },
  {
    id: "step-deliver",
    title: "We deliver at the venue",
    body: "Your meal is dropped at a designated point inside the programme venue.",
  },
] as const

export const DEFAULT_SHOWCASES = [
  {
    id: "plate-jollof",
    name: "Diba Party Jollof & Chicken",
    note: "All hours · from ₦3,850",
    imageUrl: jollof.src,
    imageAlt: jollof.alt,
    imageFocus: "",
  },
  {
    id: "plate-yam",
    name: "Boiled yam & egg sauce",
    note: "With tea or coffee · all hours",
    imageUrl: yamAndEgg.src,
    imageAlt: yamAndEgg.alt,
    imageFocus: "",
  },
  {
    id: "plate-basmati",
    name: "Basmati rice & Chicken Delish",
    note: "All hours · ₦6,500",
    imageUrl: friedRice.src,
    imageAlt: friedRice.alt,
    imageFocus: friedRice.focus ?? "",
  },
  {
    id: "plate-chicken",
    name: "Peppered chicken",
    note: "An extra for any slot · ₦3,000",
    imageUrl: grilledChicken.src,
    imageAlt: grilledChicken.alt,
    imageFocus: "",
  },
  {
    id: "plate-hake",
    name: "Hake fish",
    note: "An extra for any slot · from ₦1,500",
    imageUrl: grilledFish.src,
    imageAlt: grilledFish.alt,
    imageFocus: "",
  },
  {
    id: "plate-plantain",
    name: "Sweet plantain",
    note: "An extra for any slot · ₦1,000",
    imageUrl: plantain.src,
    imageAlt: plantain.alt,
    imageFocus: "",
  },
] as const

export const DEFAULT_SLIP_LINES = [
  { id: "slip-thu", whenLabel: "Thu breakfast", plate: "Oats & moi-moi" },
  { id: "slip-fri", whenLabel: "Fri lunch", plate: "Party jollof" },
  { id: "slip-sat", whenLabel: "Sat dinner", plate: "Suya rice" },
] as const

export const DEFAULT_MARQUEE = [
  { id: "marquee-jollof", label: "Party jollof" },
  { id: "marquee-ofada", label: "Ofada & ayamase" },
  { id: "marquee-suya", label: "Suya rice" },
  { id: "marquee-moimoi", label: "Moi-moi" },
  { id: "marquee-shawarma", label: "Shawarma" },
  { id: "marquee-yamarita", label: "Yamarita" },
  { id: "marquee-plantain", label: "Sweet plantain" },
  { id: "marquee-basmati", label: "Basmati rice" },
] as const

export const DEFAULT_TRUST = [
  { id: "trust-cutoff", label: `Cutoff is ${ORDER_CUTOFF_HOURS} hours before` },
  { id: "trust-windows", label: serviceWindowSummary() },
  { id: "trust-venue", label: "Delivered at the venue" },
] as const

export const SITE_ID = "site"

/** Original hero photo. Remove on the hero puts this back. */
export const DEFAULT_HERO_IMAGE = jollof.src

/** Stand-in when a new plate card has no photo yet. */
export const STAND_IN_PLATE_IMAGE = jollof.src

export const COPY_LIMITS = {
  eyebrow: 120,
  headlineLead: 80,
  headlineRest: 80,
  hero: 800,
  footer: 300,
  searchLabel: 60,
  searchPlaceholder: 120,
  searchButton: 24,
  heroImageAlt: 180,
  slipTitle: 80,
  platesHeading: 80,
  platesIntro: 400,
  programmesHeading: 80,
  programmesIntro: 400,
  programmesLink: 40,
  statProgrammes: 24,
  statChurches: 24,
  programmesEmptyTitle: 80,
  programmesEmptyBody: 300,
  programmesErrorTitle: 80,
  programmesErrorBody: 300,
  faqHeading: 80,
  navProgrammes: 24,
  navOrders: 24,
  navCta: 24,
  logoAlt: 80,
  footerNote: 160,
  footerStaff: 24,
  footerWhatsapp: 40,
  whatsappE164: 16,
  photoCredit: 500,
  boardEyebrow: 40,
  boardTitle: 80,
  boardIntro: 400,
  boardPlaceholder: 120,
  boardSearch: 24,
  boardClear: 24,
  boardEmptyTitle: 80,
  boardEmptyBody: 300,
  boardMetaDescription: 300,
  boardShareDescription: 300,
  orderButton: 32,
  menuSoon: 32,
  missingEyebrow: 40,
  missingTitle: 80,
  missingBody: 300,
  missingButton: 40,
  ordersEyebrow: 40,
  ordersTitle: 80,
  ordersBody: 400,
  ordersEmailLabel: 40,
  ordersButton: 40,
  ordersSending: 24,
  siteName: 40,
  socialExtra: 200,
  ogImageAlt: 180,
  stepTitle: 80,
  stepBody: 400,
  plateName: 80,
  plateNote: 120,
  plateAlt: 180,
  slipWhen: 40,
  slipPlate: 60,
  marqueeLabel: 40,
  trustLabel: 120,
  faqQuestion: 160,
  faqAnswer: 800,
} as const
