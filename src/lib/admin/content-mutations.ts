"use server"

import { failTo, requireManager } from "@/lib/admin/guard"
import { requiredText, optionalText, storedImage, writeSite } from "@/lib/admin/content-save"
import { COPY_LIMITS, DEFAULT_HERO_IMAGE } from "@/lib/site-copy"
import { contentPath } from "@/lib/site-text"

export async function saveHero(formData: FormData) {
  await requireManager(contentPath("hero"))
  const image = await storedImage(formData, "site/hero", "hero", DEFAULT_HERO_IMAGE)
  await writeSite(
    "hero",
    {
      eyebrow: requiredText(formData, "eyebrow", COPY_LIMITS.eyebrow, "hero", "Add the small line above the title."),
      headlineLead: requiredText(formData, "headlineLead", COPY_LIMITS.headlineLead, "hero", "Add the first part of the title."),
      headlineRest: requiredText(formData, "headlineRest", COPY_LIMITS.headlineRest, "hero", "Add the highlighted part of the title."),
      hero: requiredText(formData, "hero", COPY_LIMITS.hero, "hero", "Add the paragraph under the title."),
      searchLabel: requiredText(formData, "searchLabel", COPY_LIMITS.searchLabel, "hero", "Add the search label."),
      searchPlaceholder: requiredText(formData, "searchPlaceholder", COPY_LIMITS.searchPlaceholder, "hero", "Add the search hint."),
      searchButton: requiredText(formData, "searchButton", COPY_LIMITS.searchButton, "hero", "Add the search button label."),
      heroImageUrl: image.url,
      heroImageAlt: requiredText(formData, "heroImageAlt", COPY_LIMITS.heroImageAlt, "hero", "Describe the homepage photo."),
    },
    `Homepage title saved. The public site will show this text.${image.notice}`,
  )
}

export async function saveSlipTitle(formData: FormData) {
  await requireManager(contentPath("sample"))
  await writeSite(
    "sample",
    { slipTitle: requiredText(formData, "slipTitle", COPY_LIMITS.slipTitle, "sample", "Add the title on the sample order.") },
    "Sample order title saved.",
  )
}

export async function savePlatesIntro(formData: FormData) {
  await requireManager(contentPath("plates"))
  await writeSite(
    "plates",
    {
      platesHeading: requiredText(formData, "platesHeading", COPY_LIMITS.platesHeading, "plates", "Add the plates heading."),
      platesIntro: requiredText(formData, "platesIntro", COPY_LIMITS.platesIntro, "plates", "Add the sentence under the plates heading."),
    },
    "Plates heading saved.",
  )
}

export async function saveProgrammesIntro(formData: FormData) {
  await requireManager(contentPath("programmes"))
  await writeSite(
    "programmes",
    {
      programmesHeading: requiredText(formData, "programmesHeading", COPY_LIMITS.programmesHeading, "programmes", "Add the programmes heading."),
      programmesIntro: requiredText(formData, "programmesIntro", COPY_LIMITS.programmesIntro, "programmes", "Add the sentence under the programmes heading."),
      programmesLink: requiredText(formData, "programmesLink", COPY_LIMITS.programmesLink, "programmes", "Add the programmes link."),
      statProgrammes: requiredText(formData, "statProgrammes", COPY_LIMITS.statProgrammes, "programmes", "Add the programmes count label."),
      statChurches: requiredText(formData, "statChurches", COPY_LIMITS.statChurches, "programmes", "Add the churches count label."),
      programmesEmptyTitle: requiredText(formData, "programmesEmptyTitle", COPY_LIMITS.programmesEmptyTitle, "programmes", "Add the empty heading."),
      programmesEmptyBody: requiredText(formData, "programmesEmptyBody", COPY_LIMITS.programmesEmptyBody, "programmes", "Add the empty sentence."),
      programmesErrorTitle: requiredText(formData, "programmesErrorTitle", COPY_LIMITS.programmesErrorTitle, "programmes", "Add the error heading."),
      programmesErrorBody: requiredText(formData, "programmesErrorBody", COPY_LIMITS.programmesErrorBody, "programmes", "Add the error sentence."),
    },
    "Programmes block saved.",
  )
}

export async function saveFaqHeading(formData: FormData) {
  await requireManager(contentPath("questions"))
  await writeSite(
    "questions",
    { faqHeading: requiredText(formData, "faqHeading", COPY_LIMITS.faqHeading, "questions", "Add the questions heading.") },
    "Questions heading saved.",
  )
}

export async function saveHeader(formData: FormData) {
  await requireManager(contentPath("header"))
  const image = await storedImage(formData, "site/logo", "header", "")
  await writeSite(
    "header",
    {
      navProgrammes: requiredText(formData, "navProgrammes", COPY_LIMITS.navProgrammes, "header", "Add the programmes link."),
      navOrders: requiredText(formData, "navOrders", COPY_LIMITS.navOrders, "header", "Add the orders link."),
      navCta: requiredText(formData, "navCta", COPY_LIMITS.navCta, "header", "Add the button label."),
      logoAlt: requiredText(formData, "logoAlt", COPY_LIMITS.logoAlt, "header", "Describe the logo."),
      logoUrl: image.url || null,
    },
    `Header saved.${image.notice}`,
  )
}

export async function saveFooter(formData: FormData) {
  await requireManager(contentPath("footer"))
  const whatsapp = optionalText(formData, "whatsappE164", COPY_LIMITS.whatsappE164, "footer")
  if (whatsapp && !/^\d{8,15}$/.test(whatsapp)) {
    failTo(contentPath("footer"), "Enter the WhatsApp number as digits only, with the country code and no plus.")
  }
  await writeSite(
    "footer",
    {
      footer: requiredText(formData, "footer", COPY_LIMITS.footer, "footer", "Add the footer line."),
      footerNote: requiredText(formData, "footerNote", COPY_LIMITS.footerNote, "footer", "Add the cutoff line."),
      footerStaff: requiredText(formData, "footerStaff", COPY_LIMITS.footerStaff, "footer", "Add the staff link."),
      footerWhatsapp: requiredText(formData, "footerWhatsapp", COPY_LIMITS.footerWhatsapp, "footer", "Add the WhatsApp link."),
      whatsappE164: whatsapp,
      photoCredit: optionalText(formData, "photoCredit", COPY_LIMITS.photoCredit, "footer"),
    },
    "Footer saved. The public site will show this text.",
  )
}

export async function saveBoard(formData: FormData) {
  await requireManager(contentPath("board"))
  await writeSite(
    "board",
    {
      boardEyebrow: requiredText(formData, "boardEyebrow", COPY_LIMITS.boardEyebrow, "board", "Add the small line."),
      boardTitle: requiredText(formData, "boardTitle", COPY_LIMITS.boardTitle, "board", "Add the programme list heading."),
      boardIntro: requiredText(formData, "boardIntro", COPY_LIMITS.boardIntro, "board", "Add the programme list paragraph."),
      boardPlaceholder: requiredText(formData, "boardPlaceholder", COPY_LIMITS.boardPlaceholder, "board", "Add the search hint."),
      boardSearch: requiredText(formData, "boardSearch", COPY_LIMITS.boardSearch, "board", "Add the search button."),
      boardClear: requiredText(formData, "boardClear", COPY_LIMITS.boardClear, "board", "Add the clear link."),
      boardEmptyTitle: requiredText(formData, "boardEmptyTitle", COPY_LIMITS.boardEmptyTitle, "board", "Add the empty heading."),
      boardEmptyBody: requiredText(formData, "boardEmptyBody", COPY_LIMITS.boardEmptyBody, "board", "Add the empty sentence."),
      boardMetaDescription: requiredText(formData, "boardMetaDescription", COPY_LIMITS.boardMetaDescription, "board", "Add the search description."),
      boardShareDescription: requiredText(formData, "boardShareDescription", COPY_LIMITS.boardShareDescription, "board", "Add the share description."),
      orderButton: requiredText(formData, "orderButton", COPY_LIMITS.orderButton, "board", "Add the order button."),
      menuSoon: requiredText(formData, "menuSoon", COPY_LIMITS.menuSoon, "board", "Add the words shown before a menu is ready."),
    },
    "Programme list saved.",
  )
}

export async function saveMissing(formData: FormData) {
  await requireManager(contentPath("missing"))
  await writeSite(
    "missing",
    {
      missingEyebrow: requiredText(formData, "missingEyebrow", COPY_LIMITS.missingEyebrow, "missing", "Add the small line."),
      missingTitle: requiredText(formData, "missingTitle", COPY_LIMITS.missingTitle, "missing", "Add the heading."),
      missingBody: requiredText(formData, "missingBody", COPY_LIMITS.missingBody, "missing", "Add the sentence."),
      missingButton: requiredText(formData, "missingButton", COPY_LIMITS.missingButton, "missing", "Add the button label."),
    },
    "Missing page saved.",
  )
}

export async function saveOrdersPage(formData: FormData) {
  await requireManager(contentPath("orders"))
  await writeSite(
    "orders",
    {
      ordersEyebrow: requiredText(formData, "ordersEyebrow", COPY_LIMITS.ordersEyebrow, "orders", "Add the small line."),
      ordersTitle: requiredText(formData, "ordersTitle", COPY_LIMITS.ordersTitle, "orders", "Add the heading."),
      ordersBody: requiredText(formData, "ordersBody", COPY_LIMITS.ordersBody, "orders", "Add the sentence."),
      ordersEmailLabel: requiredText(formData, "ordersEmailLabel", COPY_LIMITS.ordersEmailLabel, "orders", "Add the email label."),
      ordersButton: requiredText(formData, "ordersButton", COPY_LIMITS.ordersButton, "orders", "Add the button label."),
      ordersSending: requiredText(formData, "ordersSending", COPY_LIMITS.ordersSending, "orders", "Add the sending label."),
    },
    "My orders saved.",
  )
}

export async function saveSharing(formData: FormData) {
  await requireManager(contentPath("sharing"))
  const siteName = requiredText(formData, "siteName", COPY_LIMITS.siteName, "sharing", "Add the site name.")
  if (siteName.includes("%")) failTo(contentPath("sharing"), "Leave the percent sign out of the site name.")
  await writeSite(
    "sharing",
    {
      siteName,
      socialExtra: requiredText(formData, "socialExtra", COPY_LIMITS.socialExtra, "sharing", "Add the sentence used when the site is shared."),
    },
    "Site name saved.",
  )
}

export async function saveShareImage(formData: FormData) {
  await requireManager(contentPath("sharing"))
  const image = await storedImage(formData, "site/og", "sharing", "")
  const alt = optionalText(formData, "ogImageAlt", COPY_LIMITS.ogImageAlt, "sharing")
  if (image.url && !alt) failTo(contentPath("sharing"), "Describe the share image.")
  await writeSite(
    "sharing",
    { ogImageUrl: image.url || null, ogImageAlt: alt || "Diba Meals" },
    `Share image saved.${image.notice}`,
  )
}

export async function saveFavicon(formData: FormData) {
  await requireManager(contentPath("sharing"))
  const image = await storedImage(formData, "site/favicon", "sharing", "")
  await writeSite("sharing", { faviconUrl: image.url || null }, `Browser icon saved.${image.notice}`)
}
