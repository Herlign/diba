export type PrepEntry = {
  slotStatus: string
  attendee: string
  notes: string
  items: { name: string; quantity: number }[]
}

export function prepSheet(entries: PrepEntry[]) {
  const active = entries.filter((entry) => entry.slotStatus !== "CANCELLED")
  const counts = new Map<string, number>()
  const notes: { attendee: string; notes: string }[] = []
  for (const entry of active) {
    for (const item of entry.items) {
      counts.set(item.name, (counts.get(item.name) ?? 0) + item.quantity)
    }
    if (entry.notes.trim()) notes.push({ attendee: entry.attendee, notes: entry.notes.trim() })
  }
  return {
    meals: active.length,
    lines: [...counts.entries()]
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name)),
    notes,
  }
}
