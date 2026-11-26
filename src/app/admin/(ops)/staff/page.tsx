import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { requireSection } from "@/lib/admin/require"
import { addStaff, resetStaffPassword, saveStaff, setStaffActive } from "@/lib/admin/staff-mutations"
import { Notice } from "@/components/admin/notice"

export const metadata = { title: "Team" }

const ROLES = [
  ["SUPER_ADMIN", "Manager"],
  ["CHURCH_ADMIN", "Church admin"],
  ["KITCHEN", "Kitchen"],
  ["DISPATCH", "Dispatch"],
] as const

export default async function StaffPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const staff = await requireSection("catalogue")
  if (staff.role !== "SUPER_ADMIN") redirect("/admin")
  const { notice } = await searchParams
  const people = await prisma.staffUser.findMany({ orderBy: [{ isActive: "desc" }, { name: "asc" }] })

  return (
    <div>
      <h1 className="font-heading text-4xl">Team</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Add someone, change what they can open, set a new password, or turn an account off. A turned-off account cannot sign in.
      </p>
      <Notice notice={notice} />

      <form action={addStaff} className="mt-4 grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-foreground/10 sm:grid-cols-2">
        <h2 className="font-heading text-2xl sm:col-span-2">Add someone</h2>
        <label className="block text-sm">
          Name
          <input name="name" required className="mt-1 block h-11 w-full rounded-lg border border-border px-3" />
        </label>
        <label className="block text-sm">
          Email
          <input name="email" type="email" required autoComplete="off" className="mt-1 block h-11 w-full rounded-lg border border-border px-3" />
        </label>
        <label className="block text-sm">
          Role
          <select name="role" defaultValue="KITCHEN" className="mt-1 block h-11 w-full rounded-lg border border-border px-3">
            {ROLES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Temporary password
          <input name="password" type="password" required minLength={8} autoComplete="new-password" className="mt-1 block h-11 w-full rounded-lg border border-border px-3" />
        </label>
        <button type="submit" className="h-11 rounded-lg bg-palm px-4 text-sm font-semibold text-cream sm:w-fit">
          Add to the team
        </button>
      </form>

      <ul className="mt-4 space-y-4">
        {people.map((person) => (
          <li key={person.id} className="rounded-2xl bg-white p-4 ring-1 ring-foreground/10">
            <p className="text-sm text-muted-foreground">
              {person.email}
              {person.id === staff.id ? " · This is you" : ""}
              {person.isActive ? "" : " · Turned off"}
            </p>
            <form action={saveStaff} className="mt-2 flex flex-wrap items-end gap-2">
              <input type="hidden" name="id" value={person.id} />
              <label className="text-sm">
                Name
                <input name="name" required defaultValue={person.name} className="mt-1 block h-11 w-48 rounded-lg border border-border px-3" />
              </label>
              <label className="text-sm">
                Role
                <select name="role" defaultValue={person.role} className="mt-1 block h-11 rounded-lg border border-border px-3">
                  {ROLES.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" className="h-11 rounded-lg bg-palm px-3 text-sm font-semibold text-cream">
                Save
              </button>
            </form>
            <form action={resetStaffPassword} className="mt-3 flex flex-wrap items-end gap-2">
              <input type="hidden" name="id" value={person.id} />
              <label className="text-sm">
                New password
                <input name="password" type="password" required minLength={8} autoComplete="new-password" className="mt-1 block h-11 w-56 rounded-lg border border-border px-3" />
              </label>
              <button type="submit" className="h-11 rounded-lg border border-border px-3 text-sm font-semibold">
                Set password
              </button>
            </form>
            {person.id === staff.id ? null : (
              <form action={setStaffActive} className="mt-3">
                <input type="hidden" name="id" value={person.id} />
                <input type="hidden" name="active" value={person.isActive ? "false" : "true"} />
                <button type="submit" className="h-11 text-sm font-semibold text-tomato">
                  {person.isActive ? "Turn off" : "Turn on"}
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
