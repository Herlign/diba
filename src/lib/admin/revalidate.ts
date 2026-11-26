import { revalidatePath, updateTag } from "next/cache"

/** Public pages that show programmes, dishes or homepage copy. */
export function revalidatePublic(paths: string[] = []) {
  revalidatePath("/", "layout")
  revalidatePath("/programmes")
  revalidatePath("/p/[slug]", "page")
  revalidatePath("/c/[code]", "page")
  for (const path of paths) revalidatePath(path)
}

export function revalidateContent() {
  updateTag("site-content")
  revalidatePublic(["/admin/content"])
}
