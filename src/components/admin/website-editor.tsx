import type { ReactNode } from "react"
import { Notice } from "@/components/admin/notice"
import {
  deleteFaq,
  deleteMarquee,
  deleteShowcase,
  deleteSlipLine,
  deleteStep,
  deleteTrust,
  moveFaq,
  moveMarquee,
  moveShowcase,
  moveSlipLine,
  moveStep,
  moveTrust,
  saveFaq,
  saveMarquee,
  saveShowcase,
  saveSlipLine,
  saveStep,
  saveTrust,
} from "@/lib/admin/content-blocks"
import {
  saveBoard,
  saveFaqHeading,
  saveFavicon,
  saveFooter,
  saveHeader,
  saveHero,
  saveMissing,
  saveOrdersPage,
  savePlatesIntro,
  saveProgrammesIntro,
  saveShareImage,
  saveSharing,
  saveSlipTitle,
} from "@/lib/admin/content-mutations"
import { BLOB_SETUP_MESSAGE } from "@/lib/blob-upload"
import { COPY_LIMITS, DEFAULT_HERO_IMAGE } from "@/lib/site-copy"
import type { SiteCopy } from "@/lib/site-content"
import { stepNumber } from "@/lib/site-text"

type Action = (formData: FormData) => void | Promise<void>

const inputClass = "mt-1 block h-11 w-full rounded-lg border border-border px-3"
const areaClass = "mt-1 block w-full rounded-lg border border-border px-3 py-2"
const saveClass = "h-11 rounded-lg bg-palm px-4 text-sm font-semibold text-cream"
const ghostClass = "h-11 rounded-lg border border-border px-3 text-sm font-semibold"
const dangerClass = "h-11 text-sm font-semibold text-tomato"

const LINKS = [
  ["hero", "Title"],
  ["sample", "Sample order"],
  ["marquee", "Dish names"],
  ["steps", "How it works"],
  ["plates", "Plates"],
  ["programmes", "Programmes"],
  ["questions", "Questions"],
  ["header", "Header and logo"],
  ["footer", "Footer"],
  ["board", "Programme list"],
  ["missing", "Missing page"],
  ["orders", "My orders"],
  ["sharing", "Sharing"],
] as const

function Section({
  id,
  title,
  where,
  active,
  notice,
  error,
  children,
}: {
  id: string
  title: string
  where: string
  active: boolean
  notice?: string
  error?: string
  children: ReactNode
}) {
  return (
    <section id={id} className="mt-6 scroll-mt-24 rounded-2xl bg-white p-4 ring-1 ring-foreground/10">
      <h2 className="font-heading text-2xl">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{where}</p>
      {active ? <Notice notice={notice} error={error} /> : null}
      <div className="mt-4 grid gap-3">{children}</div>
    </section>
  )
}

function TextField({
  label,
  name,
  value,
  maxLength,
  hint,
  multiline = false,
  rows = 3,
  required = true,
}: {
  label: string
  name: string
  value?: string
  maxLength: number
  hint: string
  multiline?: boolean
  rows?: number
  required?: boolean
}) {
  return (
    <label className="block text-sm">
      {label}
      {multiline ? (
        <textarea name={name} required={required} maxLength={maxLength} rows={rows} defaultValue={value} className={areaClass} />
      ) : (
        <input name={name} required={required} maxLength={maxLength} defaultValue={value} className={inputClass} />
      )}
      <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>
    </label>
  )
}

function PhotoField({
  url,
  fallback,
  removeLabel,
  hint,
  emptyLabel = "Using the original image.",
}: {
  url: string
  fallback: string
  removeLabel: string
  hint: string
  emptyLabel?: string
}) {
  const custom = Boolean(url) && url !== fallback
  return (
    <div className="grid gap-2">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" width={160} height={112} className="h-28 w-40 rounded-lg object-cover" />
      ) : (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      )}
      <input type="hidden" name="currentImage" value={url} />
      <label className="block text-sm">
        Photo
        <input name="photo" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="mt-1 block w-full text-sm" />
        <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>
      </label>
      {custom ? (
        <label className="flex items-center gap-2 text-sm">
          <input name="removePhoto" type="checkbox" value="1" className="size-5 accent-palm" />
          {removeLabel}
        </label>
      ) : null}
    </div>
  )
}

function Rank({ action, id, index, total }: { action: Action; id: string; index: number; total: number }) {
  if (total < 2) return null
  return (
    <form action={action} className="flex gap-1">
      <input type="hidden" name="id" value={id} />
      {index > 0 ? (
        <button name="direction" value="up" className={ghostClass} aria-label="Move up">
          Up
        </button>
      ) : null}
      {index < total - 1 ? (
        <button name="direction" value="down" className={ghostClass} aria-label="Move down">
          Down
        </button>
      ) : null}
    </form>
  )
}

function Item({
  heading,
  action,
  move,
  remove,
  id,
  index,
  total,
  children,
}: {
  heading: string
  action: Action
  move: Action
  remove: Action
  id: string
  index: number
  total: number
  children: ReactNode
}) {
  return (
    <div className="grid gap-2 rounded-lg border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">{heading}</p>
        <Rank action={move} id={id} index={index} total={total} />
      </div>
      <form action={action} className="grid gap-2">
        <input type="hidden" name="id" value={id} />
        {children}
        <button type="submit" className={`${saveClass} w-fit`}>
          Save
        </button>
      </form>
      <form action={remove}>
        <input type="hidden" name="id" value={id} />
        <button type="submit" className={dangerClass}>
          Remove
        </button>
      </form>
    </div>
  )
}

export function WebsiteEditor({
  copy,
  uploads,
  notice,
  error,
  section,
}: {
  copy: SiteCopy
  uploads: boolean
  notice?: string
  error?: string
  section?: string
}) {
  const active = (id: string) => section === id
  return (
    <div>
      <h1 className="font-heading text-4xl">Website</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Change the words and photos people see on the public site. Each box says where it appears. Saving one box does not change the others. Dish names, prices and programme details stay under Menu and Programmes.
      </p>
      <nav aria-label="Website sections" className="mt-4 flex flex-wrap gap-2">
        {LINKS.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="inline-flex h-10 items-center rounded-lg bg-white px-3 text-sm font-semibold text-ink ring-1 ring-foreground/10">
            {label}
          </a>
        ))}
      </nav>
      {uploads ? null : <p className="mt-4 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-foreground/10">{BLOB_SETUP_MESSAGE}</p>}

      <Section id="hero" title="Title" where="The top of the homepage: the small line, the large title, the paragraph, the search box and the photo beside them." active={active("hero")} notice={notice} error={error}>
        <form action={saveHero} className="grid gap-3">
          <TextField label="Small line above the title" name="eyebrow" value={copy.eyebrow} maxLength={COPY_LIMITS.eyebrow} hint="Sits above the large title, in green." />
          <TextField label="First part of the title" name="headlineLead" value={copy.headlineLead} maxLength={COPY_LIMITS.headlineLead} hint="The first words of the large title." />
          <TextField label="Highlighted part of the title" name="headlineRest" value={copy.headlineRest} maxLength={COPY_LIMITS.headlineRest} hint="This part sits on the gold highlight. A full stop here is enough. The site will not add a second one." />
          <TextField label="Paragraph" name="hero" value={copy.hero} maxLength={COPY_LIMITS.hero} hint="The paragraph under the title." multiline rows={5} />
          <TextField label="Search label" name="searchLabel" value={copy.searchLabel} maxLength={COPY_LIMITS.searchLabel} hint="Read out for the search box. It is not shown on screen." />
          <TextField label="Search hint" name="searchPlaceholder" value={copy.searchPlaceholder} maxLength={COPY_LIMITS.searchPlaceholder} hint="The grey text inside the search box." />
          <TextField label="Search button" name="searchButton" value={copy.searchButton} maxLength={COPY_LIMITS.searchButton} hint="The green button beside the search box." />
          <PhotoField url={copy.heroImageUrl} fallback={DEFAULT_HERO_IMAGE} removeLabel="Use the original photo" hint="JPG, PNG, WEBP or GIF, up to 5 MB. Shown in the frame on the right of the title." />
          <TextField label="Photo description" name="heroImageAlt" value={copy.heroImageAlt} maxLength={COPY_LIMITS.heroImageAlt} hint="Read out for people who cannot see the photo. Describe what is in it." />
          <button type="submit" className={`${saveClass} w-fit`}>
            Save title
          </button>
        </form>
        <div className="grid gap-3">
          <h3 className="font-heading text-xl">Lines under the search</h3>
          <p className="text-xs text-muted-foreground">Short lines under the search box. Remove the last one and they disappear.</p>
          {copy.trust.map((item, index) => (
            <Item key={item.id} heading={`Line ${index + 1}`} action={saveTrust} move={moveTrust} remove={deleteTrust} id={item.id} index={index} total={copy.trust.length}>
              <TextField label="Line" name="label" value={item.label} maxLength={COPY_LIMITS.trustLabel} hint="Shown under the search box." />
            </Item>
          ))}
          <form action={saveTrust} className="grid gap-2 rounded-lg border border-dashed border-border p-3">
            <TextField label="New line" name="label" maxLength={COPY_LIMITS.trustLabel} hint="Add another short line under the search box." required={false} />
            <button type="submit" className={`${ghostClass} w-fit`}>
              Add line
            </button>
          </form>
        </div>
      </Section>

      <Section id="sample" title="Sample order" where="The gold card that overlaps the homepage photo." active={active("sample")} notice={notice} error={error}>
        <form action={saveSlipTitle} className="grid gap-3">
          <TextField label="Card title" name="slipTitle" value={copy.slipTitle} maxLength={COPY_LIMITS.slipTitle} hint="The first line of the gold card. The card is hidden when it has no lines." />
          <button type="submit" className={`${saveClass} w-fit`}>
            Save card title
          </button>
        </form>
        {copy.slipLines.map((line, index) => (
          <Item key={line.id} heading={`Line ${index + 1}`} action={saveSlipLine} move={moveSlipLine} remove={deleteSlipLine} id={line.id} index={index} total={copy.slipLines.length}>
            <TextField label="Day and slot" name="whenLabel" value={line.whenLabel} maxLength={COPY_LIMITS.slipWhen} hint="Left side of the line, such as Thu breakfast." />
            <TextField label="Meal" name="plate" value={line.plate} maxLength={COPY_LIMITS.slipPlate} hint="Right side of the line." />
          </Item>
        ))}
        <form action={saveSlipLine} className="grid gap-2 rounded-lg border border-dashed border-border p-3">
          <TextField label="Day and slot" name="whenLabel" maxLength={COPY_LIMITS.slipWhen} hint="Left side of a new line." required={false} />
          <TextField label="Meal" name="plate" maxLength={COPY_LIMITS.slipPlate} hint="Right side of a new line." required={false} />
          <button type="submit" className={`${ghostClass} w-fit`}>
            Add line
          </button>
        </form>
      </Section>

      <Section id="marquee" title="Dish names" where="The scrolling gold band under the homepage title." active={active("marquee")} notice={notice} error={error}>
        {copy.marquee.map((item, index) => (
          <Item key={item.id} heading={`Name ${index + 1}`} action={saveMarquee} move={moveMarquee} remove={deleteMarquee} id={item.id} index={index} total={copy.marquee.length}>
            <TextField label="Dish name" name="label" value={item.label} maxLength={COPY_LIMITS.marqueeLabel} hint="One name in the scrolling band." />
          </Item>
        ))}
        <form action={saveMarquee} className="grid gap-2 rounded-lg border border-dashed border-border p-3">
          <TextField label="New dish name" name="label" maxLength={COPY_LIMITS.marqueeLabel} hint="Add a name to the scrolling band." required={false} />
          <button type="submit" className={`${ghostClass} w-fit`}>
            Add name
          </button>
        </form>
      </Section>

      <Section id="steps" title="How it works" where="The numbered steps on the pale band under the dish names. The number follows the order, so the first step is 01." active={active("steps")} notice={notice} error={error}>
        {copy.steps.map((step, index) => (
          <Item key={step.id} heading={`Step ${stepNumber(index)}`} action={saveStep} move={moveStep} remove={deleteStep} id={step.id} index={index} total={copy.steps.length}>
            <TextField label="Title" name="title" value={step.title} maxLength={COPY_LIMITS.stepTitle} hint="The heading of this step." />
            <TextField label="Words" name="body" value={step.body} maxLength={COPY_LIMITS.stepBody} hint="The sentence under the heading." multiline />
          </Item>
        ))}
        <form action={saveStep} className="grid gap-2 rounded-lg border border-dashed border-border p-3">
          <TextField label="New step title" name="title" maxLength={COPY_LIMITS.stepTitle} hint="Heading for a new step." required={false} />
          <TextField label="Words" name="body" maxLength={COPY_LIMITS.stepBody} hint="The sentence under the new heading." multiline required={false} />
          <button type="submit" className={`${ghostClass} w-fit`}>
            Add step
          </button>
        </form>
      </Section>

      <Section id="plates" title="Plates" where="The Freshly prepared cards on the homepage. Each card has a photo, a name and a short line." active={active("plates")} notice={notice} error={error}>
        <form action={savePlatesIntro} className="grid gap-3">
          <TextField label="Heading" name="platesHeading" value={copy.platesHeading} maxLength={COPY_LIMITS.platesHeading} hint="The large heading above the cards." />
          <TextField label="Sentence" name="platesIntro" value={copy.platesIntro} maxLength={COPY_LIMITS.platesIntro} hint="The sentence under that heading." multiline />
          <button type="submit" className={`${saveClass} w-fit`}>
            Save heading
          </button>
        </form>
        {copy.showcases.map((plate, index) => (
          <Item key={plate.id} heading={plate.name} action={saveShowcase} move={moveShowcase} remove={deleteShowcase} id={plate.id} index={index} total={copy.showcases.length}>
            <TextField label="Name" name="name" value={plate.name} maxLength={COPY_LIMITS.plateName} hint="The name on the card." />
            <TextField label="Line under the name" name="note" value={plate.note} maxLength={COPY_LIMITS.plateNote} hint="The smaller line under the name." />
            <PhotoField url={plate.imageUrl} fallback="" removeLabel="Use the stand-in photo" hint="Replaces the photo on this card. JPG, PNG, WEBP or GIF, up to 5 MB." />
            <TextField label="Photo description" name="imageAlt" value={plate.imageAlt} maxLength={COPY_LIMITS.plateAlt} hint="Read out for people who cannot see the photo." />
          </Item>
        ))}
        <form action={saveShowcase} className="grid gap-2 rounded-lg border border-dashed border-border p-3">
          <TextField label="New plate name" name="name" maxLength={COPY_LIMITS.plateName} hint="The name on a new card." required={false} />
          <TextField label="Line under the name" name="note" maxLength={COPY_LIMITS.plateNote} hint="The smaller line under the name." required={false} />
          <PhotoField url="" fallback="" removeLabel="Use the stand-in photo" emptyLabel="No photo yet. The card will use a stand-in until you upload one." hint="Optional. JPG, PNG, WEBP or GIF, up to 5 MB." />
          <TextField label="Photo description" name="imageAlt" maxLength={COPY_LIMITS.plateAlt} hint="Describe the photo, or repeat the plate name." required={false} />
          <button type="submit" className={`${ghostClass} w-fit`}>
            Add plate
          </button>
        </form>
      </Section>

      <Section id="programmes" title="Programmes on the homepage" where="The block that lists published programmes, including the counts, the empty message and the message shown if the list cannot load." active={active("programmes")} notice={notice} error={error}>
        <form action={saveProgrammesIntro} className="grid gap-3">
          <TextField label="Heading" name="programmesHeading" value={copy.programmesHeading} maxLength={COPY_LIMITS.programmesHeading} hint="The large heading of this block." />
          <TextField label="Sentence" name="programmesIntro" value={copy.programmesIntro} maxLength={COPY_LIMITS.programmesIntro} hint="The sentence under the heading." multiline />
          <TextField label="Link" name="programmesLink" value={copy.programmesLink} maxLength={COPY_LIMITS.programmesLink} hint="The link at the right of the heading. It still opens the programme list." />
          <TextField label="Programmes count" name="statProgrammes" value={copy.statProgrammes} maxLength={COPY_LIMITS.statProgrammes} hint="The label beside the number of programmes." />
          <TextField label="Churches count" name="statChurches" value={copy.statChurches} maxLength={COPY_LIMITS.statChurches} hint="The label beside the number of churches." />
          <TextField label="Empty heading" name="programmesEmptyTitle" value={copy.programmesEmptyTitle} maxLength={COPY_LIMITS.programmesEmptyTitle} hint="Shown when nothing is published." />
          <TextField label="Empty sentence" name="programmesEmptyBody" value={copy.programmesEmptyBody} maxLength={COPY_LIMITS.programmesEmptyBody} hint="The sentence under the empty heading." multiline />
          <TextField label="Problem heading" name="programmesErrorTitle" value={copy.programmesErrorTitle} maxLength={COPY_LIMITS.programmesErrorTitle} hint="Shown when the list cannot load." />
          <TextField label="Problem sentence" name="programmesErrorBody" value={copy.programmesErrorBody} maxLength={COPY_LIMITS.programmesErrorBody} hint="The sentence under that heading." multiline />
          <button type="submit" className={`${saveClass} w-fit`}>
            Save programmes block
          </button>
        </form>
      </Section>

      <Section id="questions" title="Questions" where="The questions at the bottom of the homepage. The heading is on the left and the questions open on the right." active={active("questions")} notice={notice} error={error}>
        <form action={saveFaqHeading} className="grid gap-3">
          <TextField label="Heading" name="faqHeading" value={copy.faqHeading} maxLength={COPY_LIMITS.faqHeading} hint="The heading beside the questions." />
          <button type="submit" className={`${saveClass} w-fit`}>
            Save heading
          </button>
        </form>
        {copy.faqs.map((faq, index) => (
          <Item key={faq.id} heading={`Question ${index + 1}`} action={saveFaq} move={moveFaq} remove={deleteFaq} id={faq.id} index={index} total={copy.faqs.length}>
            <TextField label="Question" name="question" value={faq.question} maxLength={COPY_LIMITS.faqQuestion} hint="The line people click to open the answer." />
            <TextField label="Answer" name="answer" value={faq.answer} maxLength={COPY_LIMITS.faqAnswer} hint="Shown when the question is opened." multiline />
          </Item>
        ))}
        <form action={saveFaq} className="grid gap-2 rounded-lg border border-dashed border-border p-3">
          <TextField label="New question" name="question" maxLength={COPY_LIMITS.faqQuestion} hint="The line people click." required={false} />
          <TextField label="Answer" name="answer" maxLength={COPY_LIMITS.faqAnswer} hint="Shown when the question is opened." multiline required={false} />
          <button type="submit" className={`${ghostClass} w-fit`}>
            Add question
          </button>
        </form>
      </Section>

      <Section id="header" title="Header and logo" where="The bar at the top of every public page. The words change. The links stay where they are." active={active("header")} notice={notice} error={error}>
        <form action={saveHeader} className="grid gap-3">
          <TextField label="Programmes link" name="navProgrammes" value={copy.navProgrammes} maxLength={COPY_LIMITS.navProgrammes} hint="The first link in the top bar. It opens the programme list." />
          <TextField label="Orders link" name="navOrders" value={copy.navOrders} maxLength={COPY_LIMITS.navOrders} hint="The link that opens My orders." />
          <TextField label="Button" name="navCta" value={copy.navCta} maxLength={COPY_LIMITS.navCta} hint="The green button in the top bar. It opens the programme list." />
          <TextField label="Logo description" name="logoAlt" value={copy.logoAlt} maxLength={COPY_LIMITS.logoAlt} hint="Read out for the logo in the header and the footer." />
          <PhotoField url={copy.logoUrl ?? ""} fallback="" removeLabel="Remove this photo and use the Diba logo" hint="Optional. Leave it empty to keep the Diba logo. A wide PNG or JPG works best." />
          <button type="submit" className={`${saveClass} w-fit`}>
            Save header
          </button>
        </form>
      </Section>

      <Section id="footer" title="Footer" where="The bottom of every public page, under the logo." active={active("footer")} notice={notice} error={error}>
        <form action={saveFooter} className="grid gap-3">
          <TextField label="Footer line" name="footer" value={copy.footer} maxLength={COPY_LIMITS.footer} hint="The sentence under the logo." multiline rows={2} />
          <TextField label="Cutoff line" name="footerNote" value={copy.footerNote} maxLength={COPY_LIMITS.footerNote} hint="The line beside the staff link." />
          <TextField label="Staff link" name="footerStaff" value={copy.footerStaff} maxLength={COPY_LIMITS.footerStaff} hint="The link that opens the staff sign-in." />
          <TextField label="WhatsApp link" name="footerWhatsapp" value={copy.footerWhatsapp} maxLength={COPY_LIMITS.footerWhatsapp} hint="The support link in the footer." />
          <TextField label="WhatsApp number" name="whatsappE164" value={copy.whatsappE164} maxLength={COPY_LIMITS.whatsappE164} hint={`Digits only, country code first, no plus. Leave blank to keep ${copy.whatsappNumber}.`} required={false} />
          <TextField label="Photo credit" name="photoCredit" value={copy.photoCredit} maxLength={COPY_LIMITS.photoCredit} hint="The small credit under the footer. Clear it if you have replaced the stock photos and this credit no longer applies." multiline required={false} />
          <button type="submit" className={`${saveClass} w-fit`}>
            Save footer
          </button>
        </form>
      </Section>

      <Section id="board" title="Programme list" where="The Programmes page, opened from the top bar. The order button is also used on each programme card." active={active("board")} notice={notice} error={error}>
        <form action={saveBoard} className="grid gap-3">
          <TextField label="Small line" name="boardEyebrow" value={copy.boardEyebrow} maxLength={COPY_LIMITS.boardEyebrow} hint="The small green line above the heading." />
          <TextField label="Heading" name="boardTitle" value={copy.boardTitle} maxLength={COPY_LIMITS.boardTitle} hint="The large heading on the programme list." />
          <TextField label="Paragraph" name="boardIntro" value={copy.boardIntro} maxLength={COPY_LIMITS.boardIntro} hint="The paragraph under the heading." multiline />
          <TextField label="Search hint" name="boardPlaceholder" value={copy.boardPlaceholder} maxLength={COPY_LIMITS.boardPlaceholder} hint="The grey text inside the search box on this page." />
          <TextField label="Search button" name="boardSearch" value={copy.boardSearch} maxLength={COPY_LIMITS.boardSearch} hint="The button beside the search box." />
          <TextField label="Clear link" name="boardClear" value={copy.boardClear} maxLength={COPY_LIMITS.boardClear} hint="Shown after a search, to clear it." />
          <TextField label="No match heading" name="boardEmptyTitle" value={copy.boardEmptyTitle} maxLength={COPY_LIMITS.boardEmptyTitle} hint="Shown when a search matches nothing." />
          <TextField label="No match sentence" name="boardEmptyBody" value={copy.boardEmptyBody} maxLength={COPY_LIMITS.boardEmptyBody} hint="The sentence under that heading." multiline />
          <TextField label="Search description" name="boardMetaDescription" value={copy.boardMetaDescription} maxLength={COPY_LIMITS.boardMetaDescription} hint="The description search engines use for this page." multiline />
          <TextField label="Share description" name="boardShareDescription" value={copy.boardShareDescription} maxLength={COPY_LIMITS.boardShareDescription} hint="The sentence used when this page is shared." multiline />
          <TextField label="Order button" name="orderButton" value={copy.orderButton} maxLength={COPY_LIMITS.orderButton} hint="The button on each programme card." />
          <TextField label="Menu not ready" name="menuSoon" value={copy.menuSoon} maxLength={COPY_LIMITS.menuSoon} hint="Shown on a card before a price is available." />
          <button type="submit" className={`${saveClass} w-fit`}>
            Save programme list
          </button>
        </form>
      </Section>

      <Section id="missing" title="Missing page" where="The page people see when a link does not match anything on the site." active={active("missing")} notice={notice} error={error}>
        <form action={saveMissing} className="grid gap-3">
          <TextField label="Small line" name="missingEyebrow" value={copy.missingEyebrow} maxLength={COPY_LIMITS.missingEyebrow} hint="The small line above the heading." />
          <TextField label="Heading" name="missingTitle" value={copy.missingTitle} maxLength={COPY_LIMITS.missingTitle} hint="The large heading." />
          <TextField label="Sentence" name="missingBody" value={copy.missingBody} maxLength={COPY_LIMITS.missingBody} hint="The sentence under the heading." multiline />
          <TextField label="Button" name="missingButton" value={copy.missingButton} maxLength={COPY_LIMITS.missingButton} hint="The button that opens the programme list." />
          <button type="submit" className={`${saveClass} w-fit`}>
            Save missing page
          </button>
        </form>
      </Section>

      <Section id="orders" title="My orders" where="The page where someone asks for a link to the meals they booked." active={active("orders")} notice={notice} error={error}>
        <form action={saveOrdersPage} className="grid gap-3">
          <TextField label="Small line" name="ordersEyebrow" value={copy.ordersEyebrow} maxLength={COPY_LIMITS.ordersEyebrow} hint="The small green line above the heading." />
          <TextField label="Heading" name="ordersTitle" value={copy.ordersTitle} maxLength={COPY_LIMITS.ordersTitle} hint="The large heading." />
          <TextField label="Sentence" name="ordersBody" value={copy.ordersBody} maxLength={COPY_LIMITS.ordersBody} hint="The paragraph under the heading." multiline />
          <TextField label="Email label" name="ordersEmailLabel" value={copy.ordersEmailLabel} maxLength={COPY_LIMITS.ordersEmailLabel} hint="The label on the email box." />
          <TextField label="Button" name="ordersButton" value={copy.ordersButton} maxLength={COPY_LIMITS.ordersButton} hint="The button that sends the link." />
          <TextField label="Sending" name="ordersSending" value={copy.ordersSending} maxLength={COPY_LIMITS.ordersSending} hint="Shown on the button while the link is being sent." />
          <button type="submit" className={`${saveClass} w-fit`}>
            Save my orders
          </button>
        </form>
      </Section>

      <Section id="sharing" title="Sharing" where="The site name, and the picture and sentence used when someone shares the homepage." active={active("sharing")} notice={notice} error={error}>
        <form action={saveSharing} className="grid gap-3">
          <TextField label="Site name" name="siteName" value={copy.siteName} maxLength={COPY_LIMITS.siteName} hint="The name in the browser tab. Page titles keep their own words and add this name." />
          <TextField label="Share sentence" name="socialExtra" value={copy.socialExtra} maxLength={COPY_LIMITS.socialExtra} hint="Added after the homepage title when the link is shared. The page description uses the title and the footer line." multiline />
          <button type="submit" className={`${saveClass} w-fit`}>
            Save site name
          </button>
        </form>
        <form action={saveShareImage} className="grid gap-3">
          <PhotoField url={copy.ogImageUrl ?? ""} fallback="" removeLabel="Remove this image and use the original" hint="Shown when the homepage is shared. A wide photo works best. Leave it empty to keep the original." />
          <TextField label="Share image description" name="ogImageAlt" value={copy.ogImageAlt} maxLength={COPY_LIMITS.ogImageAlt} hint="Describe the share image." required={false} />
          <button type="submit" className={`${saveClass} w-fit`}>
            Save share image
          </button>
        </form>
        <form action={saveFavicon} className="grid gap-3">
          <PhotoField url={copy.faviconUrl ?? ""} fallback="" removeLabel="Remove this icon and use the original" hint="The small icon in the browser tab. A square PNG works best. Leave it empty to keep the original." />
          <button type="submit" className={`${saveClass} w-fit`}>
            Save browser icon
          </button>
        </form>
      </Section>
    </div>
  )
}
