export function csvRow(cells: (string | number | null | undefined)[]) {
  return cells
    .map((cell) => {
      const text = cell == null ? "" : String(cell)
      return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
    })
    .join(",")
}
