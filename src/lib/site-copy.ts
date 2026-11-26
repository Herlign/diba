import { MARKETING, ORDER_CUTOFF_HOURS, SERVICE_WINDOWS } from "@/lib/catalogue"
import { formatClock } from "@/lib/dates"

const [morning, afternoon, evening] = SERVICE_WINDOWS

/** Homepage copy used when the database row is missing. Matches the previous hard-coded site. */
export const DEFAULT_SITE_CONTENT = {
  eyebrow: MARKETING.eyebrow,
  headlineLead: MARKETING.headlineLead,
  headlineRest: MARKETING.headlineRest,
  hero: MARKETING.hero,
  footer: MARKETING.footer,
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

export const SITE_ID = "site"
