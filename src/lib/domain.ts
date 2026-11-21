export const ProgrammeStatus = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  CLOSED: "CLOSED",
  ARCHIVED: "ARCHIVED",
} as const

export const LISTED_PROGRAMME_STATUSES = [
  ProgrammeStatus.PUBLISHED,
  ProgrammeStatus.CLOSED,
] as const

export const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Ordering open",
  CLOSED: "Ordering closed",
  ARCHIVED: "Archived",
}

export function parseQuery(value: string | undefined) {
  return typeof value === "string" ? value.trim() : ""
}
