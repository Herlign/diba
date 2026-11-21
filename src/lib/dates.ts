import { formatInTimeZone } from "date-fns-tz"

export const LAGOS = "Africa/Lagos"

function parts(date: Date) {
  return {
    day: formatInTimeZone(date, LAGOS, "d"),
    month: formatInTimeZone(date, LAGOS, "MMM"),
    year: formatInTimeZone(date, LAGOS, "yyyy"),
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

export function formatWindow(start: string, end: string) {
  return `${formatClock(start)}–${formatClock(end)}`
}

export function formatDayLabel(date: Date) {
  return formatInTimeZone(date, LAGOS, "EEE d MMM")
}

export function formatLagosMoment(date: Date) {
  const day = formatInTimeZone(date, LAGOS, "EEE d MMM")
  const clock = formatInTimeZone(date, LAGOS, "HH:mm")
  return `${day}, ${formatClock(clock)}`
}

export function formatClock(hhmm: string) {
  const [hourText, minuteText] = hhmm.split(":")
  const hour = Number(hourText)
  const minute = Number(minuteText)
  const suffix = hour >= 12 ? "pm" : "am"
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  const minutes = minute === 0 ? "00" : String(minute).padStart(2, "0")
  return `${hour12}:${minutes}${suffix}`
}
