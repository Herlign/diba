import { Button } from "@/components/ui/button"
import { LIST_STATUS_FILTERS, type ListStatusFilter } from "@/lib/domain"

export function ProgrammeFilters({
  status,
  city,
  q,
  cities,
}: {
  status: ListStatusFilter
  city: string
  q: string
  cities: string[]
}) {
  const active = status !== "all" || (city !== "" && city !== "all") || q.trim() !== ""
  return (
    <form action="/programmes" method="get" className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto] sm:items-end">
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Show</span>
        <select
          name="status"
          defaultValue={status}
          className="h-10 rounded-lg border border-input bg-card px-3 text-sm"
        >
          {LIST_STATUS_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">City</span>
        <select
          name="city"
          defaultValue={city || "all"}
          className="h-10 rounded-lg border border-input bg-card px-3 text-sm"
        >
          <option value="all">All cities</option>
          {cities.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Search</span>
        <input
          name="q"
          defaultValue={q}
          placeholder="Ministry, venue, or city"
          className="h-10 rounded-lg border border-input bg-card px-3 text-sm placeholder:text-muted-foreground"
        />
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" className="h-10 px-4">
          Apply
        </Button>
        {active ? (
          <a href="/programmes" className="text-sm text-muted-foreground hover:text-foreground">
            Clear
          </a>
        ) : null}
      </div>
    </form>
  )
}
