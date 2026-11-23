import type { Metadata } from "next"
import { Logo } from "@/components/layout/logo"
import { loginAction } from "@/lib/auth/actions"

export const instant = false

export const metadata: Metadata = { title: "Staff sign in" }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const message =
    error === "rate"
      ? "Too many tries. Wait a few minutes."
      : error
        ? "Those details don't match a staff account."
        : ""
  return (
    <div className="bg-white text-ink">
      <form action={loginAction} className="rise mx-auto max-w-md px-4 py-16">
        <Logo priority className="h-16 w-auto" />
        <p className="mt-8 text-sm font-semibold tracking-wide text-palm uppercase">Staff</p>
        <h1 className="mt-2 font-heading text-4xl">Sign in to the kitchen</h1>
        <p className="mt-3 text-sm text-muted-foreground">Use the staff email from the README. Attendees do not sign in here.</p>
        <label className="mt-6 block text-sm font-medium">
          Email
          <input name="email" type="email" required autoComplete="username" className="mt-1 h-12 w-full rounded-lg border border-border bg-white px-3" />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Password
          <input name="password" type="password" required autoComplete="current-password" className="mt-1 h-12 w-full rounded-lg border border-border bg-white px-3" />
        </label>
        {message ? <p className="mt-3 text-sm text-tomato">{message}</p> : null}
        <button type="submit" className="mt-5 inline-flex h-12 items-center rounded-lg bg-palm px-5 text-sm font-semibold text-cream">
          Sign in
        </button>
      </form>
    </div>
  )
}
