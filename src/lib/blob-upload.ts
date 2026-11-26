import "server-only"

import { put } from "@vercel/blob"

const MAX_BYTES = 5 * 1024 * 1024

const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
}

export const BLOB_SETUP_MESSAGE =
  "Photo upload is not set up yet. In the Vercel project, open Storage, create a Blob store, and connect it so BLOB_READ_WRITE_TOKEN is set. Then redeploy. You can still save the other fields."

export function blobReady() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

type UploadResult =
  | { ok: true; url: string }
  | { ok: false; reason: "missing-token" | "invalid"; error: string }

export async function uploadImage(file: File, prefix: string): Promise<UploadResult> {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) {
    return { ok: false, reason: "missing-token", error: "Photo storage is not set up yet." }
  }
  if (!(file instanceof File) || file.size <= 0) {
    return { ok: false, reason: "invalid", error: "Choose a photo first." }
  }
  const extension = TYPES[file.type]
  if (!extension) {
    return { ok: false, reason: "invalid", error: "Use a JPG, PNG, WEBP or GIF photo." }
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, reason: "invalid", error: "That photo is larger than 5 MB. Choose a smaller one." }
  }
  try {
    const blob = await put(`${prefix}-${Date.now()}.${extension}`, file, {
      access: "public",
      contentType: file.type,
      token,
    })
    return { ok: true, url: blob.url }
  } catch {
    return { ok: false, reason: "invalid", error: "The photo could not be saved. Try a smaller JPG or PNG." }
  }
}

type PhotoFormResult = { ok: true; url: string; notice: string } | { ok: false; error: string }

/** Keeps the current URL when no file was chosen. A bad file is an error. A missing token keeps the current URL and explains why. */
export async function photoFromForm(formData: FormData, prefix: string, current: string): Promise<PhotoFormResult> {
  const photo = formData.get("photo")
  if (!(photo instanceof File) || photo.size <= 0) return { ok: true, url: current, notice: "" }
  const uploaded = await uploadImage(photo, prefix)
  if (!uploaded.ok) {
    if (uploaded.reason === "missing-token") {
      return { ok: true, url: current, notice: " The photo was not uploaded because storage is not set up yet." }
    }
    return { ok: false, error: uploaded.error }
  }
  return { ok: true, url: uploaded.url, notice: "" }
}
