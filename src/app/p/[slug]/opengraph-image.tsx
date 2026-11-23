import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"
import { loadOrderingProgramme } from "@/lib/ordering/load-programme"

export const alt = "Diba Meals programme"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function ProgrammeOg({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const programme = await loadOrderingProgramme(slug)
  const title = programme?.title ?? "Diba Meals"
  const church = programme?.churchName ?? "Church programmes"
  const dates = programme?.dateKeys.length
    ? `${pretty(programme.dateKeys[0]!)} – ${pretty(programme.dateKeys.at(-1)!)}`
    : "Morning and evening plates"
  const wordmark = await readFile(join(process.cwd(), "public/brand/diba-wordmark.png"))
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "#f7f6f3",
        color: "#1a120c",
        padding: "64px",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex" }}>
        <img
          src={`data:image/png;base64,${wordmark.toString("base64")}`}
          alt="Diba Meals"
          width={96}
          height={105}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 72, lineHeight: 1.05, letterSpacing: -1 }}>{title}</div>
        <div style={{ display: "flex", marginTop: 18, fontSize: 32, color: "#5c5348" }}>{church}</div>
        <div style={{ display: "flex", marginTop: 8, fontSize: 28, color: "#0c3d2e" }}>{dates}</div>
      </div>
      <div
        style={{
          display: "flex",
          background: "#f5b301",
          color: "#1a120c",
          fontSize: 26,
          fontWeight: 700,
          padding: "14px 20px",
          borderRadius: 14,
        }}
      >
        Order the plates. We bring them to your block.
      </div>
    </div>,
    { ...size },
  )
}

function pretty(key: string) {
  const [year, month, day] = key.split("-")
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return `${Number(day)} ${names[Number(month) - 1]} ${year}`
}
