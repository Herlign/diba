import { OpsNav } from "@/components/admin/ops-nav"
import { requireSection } from "@/lib/admin/require"

export const instant = false

export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireSection("overview")
  return (
    <div className="min-h-full bg-[#f7f6f3] text-ink">
      <OpsNav role={staff.role} name={staff.name} />
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">{children}</div>
    </div>
  )
}
