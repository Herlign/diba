type SnapshottedLine = {
  nameSnapshot: string
  variantLabelSnapshot?: string | null
}

/** Chosen portion, falling back to the combined snapshot on older orders. */
export function orderLineLabel(item: SnapshottedLine) {
  const label = item.variantLabelSnapshot?.trim()
  const snapshot = item.nameSnapshot.trim()
  if (!label) return snapshot
  const suffix = ` · ${label}`
  if (snapshot.toLowerCase().endsWith(suffix.toLowerCase())) return snapshot
  return `${snapshot}${suffix}`
}

export function formatOrderLine(item: SnapshottedLine & { quantity: number }) {
  return `${item.quantity}× ${orderLineLabel(item)}`
}
