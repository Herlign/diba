const LAGOS = "Africa/Lagos"

function parts(date: Date) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: LAGOS,
    day: "numeric",
    month: "short",
    year: "numeric",
  })
  const bag = Object.fromEntries(
    fmt.formatToParts(date).map((part) => [part.type, part.value]),
  )
  return {
    day: bag.day ?? "",
    month: bag.month ?? "",
    year: bag.year ?? "",
  }
}

export function formatDateRange(start: Date, end: Date): string {
  const a = parts(start)
  const b = parts(end)
  if (a.day === b.day && a.month === b.month && a.year === b.year) {
    return `${a.day} ${a.month} ${a.year}`
  }
  if (a.month === b.month && a.year === b.year) {
    return `${a.day}–${b.day} ${b.month} ${b.year}`
  }
  if (a.year === b.year) {
    return `${a.day} ${a.month} – ${b.day} ${b.month} ${b.year}`
  }
  return `${a.day} ${a.month} ${a.year} – ${b.day} ${b.month} ${b.year}`
}

export function formatLagosWhen(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: LAGOS,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hourCycle: "h12",
  }).format(date)
}
