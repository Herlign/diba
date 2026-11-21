import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "src/lib/ordering/**/*.test.ts",
      "src/lib/checkout/**/*.test.ts",
      "src/lib/payments/**/*.test.ts",
      "src/lib/passes/**/*.test.ts",
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
