import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { requireSection } from "@/lib/admin/require"
import { saveSiteContent } from "@/lib/admin/content-mutations"
import { Notice } from "@/components/admin/notice"
import { DEFAULT_FAQS, DEFAULT_SITE_CONTENT, SITE_ID } from "@/lib/site-copy"

export const metadata = { title: "Homepage" }

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const staff = await requireSection("catalogue")
  if (staff.role !== "SUPER_ADMIN") redirect("/admin")
  const { notice } = await searchParams
  const row = await prisma.siteContent.findUnique({
    where: { id: SITE_ID },
    include: { faqs: { orderBy: { position: "asc" } } },
  })
  const copy = row ?? DEFAULT_SITE_CONTENT
  const faqs = row?.faqs.length ? row.faqs : DEFAULT_FAQS.map((faq) => ({ ...faq }))

  return (
    <div>
      <h1 className="font-heading text-4xl">Homepage</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        These words appear on the public homepage and in the footer. The site stays as it is until you save a change.
      </p>
      <Notice notice={notice} />
      <form action={saveSiteContent} className="mt-4 grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-foreground/10">
        <label className="block text-sm">
          Small line above the title
          <input name="eyebrow" required maxLength={120} defaultValue={copy.eyebrow} className="mt-1 block h-11 w-full rounded-lg border border-border px-3" />
        </label>
        <label className="block text-sm">
          First part of the title
          <input name="headlineLead" required maxLength={80} defaultValue={copy.headlineLead} className="mt-1 block h-11 w-full rounded-lg border border-border px-3" />
        </label>
        <label className="block text-sm">
          Highlighted part of the title
          <input name="headlineRest" required maxLength={80} defaultValue={copy.headlineRest} className="mt-1 block h-11 w-full rounded-lg border border-border px-3" />
          <span className="mt-1 block text-xs text-muted-foreground">This part sits on the gold highlight.</span>
        </label>
        <label className="block text-sm">
          Paragraph
          <textarea name="hero" required maxLength={800} rows={5} defaultValue={copy.hero} className="mt-1 block w-full rounded-lg border border-border px-3 py-2" />
        </label>
        <label className="block text-sm">
          Footer line
          <textarea name="footer" required maxLength={300} rows={2} defaultValue={copy.footer} className="mt-1 block w-full rounded-lg border border-border px-3 py-2" />
        </label>
        <fieldset className="space-y-3">
          <legend className="font-heading text-2xl">Questions</legend>
          {faqs.map((faq) => (
            <div key={faq.id} className="grid gap-2 rounded-lg border border-border p-3">
              <input type="hidden" name="faqId" value={faq.id} />
              <label className="block text-sm">
                Question
                <input name="question" maxLength={160} defaultValue={faq.question} className="mt-1 block h-11 w-full rounded-lg border border-border px-3" />
              </label>
              <label className="block text-sm">
                Answer
                <textarea name="answer" maxLength={800} rows={3} defaultValue={faq.answer} className="mt-1 block w-full rounded-lg border border-border px-3 py-2" />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input name="drop" type="checkbox" value={faq.id} className="size-5 accent-palm" />
                Remove this question
              </label>
            </div>
          ))}
          <div className="grid gap-2 rounded-lg border border-dashed border-border p-3">
            <input type="hidden" name="faqId" value="" />
            <label className="block text-sm">
              New question
              <input name="question" maxLength={160} className="mt-1 block h-11 w-full rounded-lg border border-border px-3" />
            </label>
            <label className="block text-sm">
              Answer
              <textarea name="answer" maxLength={800} rows={3} className="mt-1 block w-full rounded-lg border border-border px-3 py-2" />
            </label>
          </div>
        </fieldset>
        <button type="submit" className="h-11 rounded-lg bg-palm px-4 text-sm font-semibold text-cream sm:w-fit">
          Save homepage
        </button>
      </form>
    </div>
  )
}
