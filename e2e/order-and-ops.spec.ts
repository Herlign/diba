import { expect, test } from "@playwright/test"

const adminEmail = "ada.admin@dibameals.test"
const adminPassword = "DibaAdmin!2026"

test("browse, mock pay, confirmation, my orders, then kitchen and dispatch", async ({ page }) => {
  const stamp = Date.now().toString().slice(-7)
  const phone = `0803${stamp}`
  const email = `guest${stamp}@dibameals.test`

  await page.goto("/programmes")
  await expect(page.getByRole("heading", { name: "Find your programme" })).toBeVisible()
  await page.goto("/c/CROSS26")
  await expect(page.getByRole("heading", { name: "Crossover Convention 2026" })).toBeVisible()

  const slots = page.locator("button[aria-pressed]")
  await slots.nth(0).click()
  await slots.nth(2).click()
  const akara = page.locator("article").filter({ has: page.getByRole("heading", { name: "Akara & Pap" }) }).first()
  await akara.getByRole("button", { name: "Add", exact: true }).click()
  await page.getByRole("button", { name: "Add meals" }).click()
  await page.getByRole("link", { name: "Review" }).click()
  await page.getByRole("link", { name: "Continue to checkout" }).click()

  await page.locator("input[name=fullName]").fill("E2e Guest")
  await page.locator("input[name=phone]").fill(phone)
  await page.locator("input[name=email]").fill(email)
  await page.locator("input[name=numberOfPeople]").fill("1")
  await page.locator("select[name=deliveryPointId]").selectOption({ index: 1 })
  await page.locator("input[name=acceptedTerms]").check()
  await page.getByRole("button", { name: "Pay", exact: true }).click()
  await page.getByRole("button", { name: "Mark as paid" }).click()
  await expect(page.getByRole("img", { name: /Meal pass/ }).first()).toBeVisible()
  const reference = (await page.locator("body").innerText()).match(/DM-CROSS26-\d+/)?.[0]
  expect(reference).toBeTruthy()

  await page.goto("/my-orders")
  await page.locator("input[name=email]").fill(email)
  await page.getByRole("button", { name: "Email me a link" }).click()
  await page.getByRole("link", { name: "Open my orders" }).click()
  await expect(page.getByText(reference!)).toBeVisible()
  await expect(page.getByText("Akara & Pap").first()).toBeVisible()

  await page.goto("/admin/login")
  await page.locator("input[name=email]").fill(adminEmail)
  await page.locator("input[name=password]").fill(adminPassword)
  await page.getByRole("button", { name: "Sign in" }).click()
  await expect(page.getByRole("heading", { name: "Crossover Convention 2026" })).toBeVisible()

  await page.goto("/admin/kitchen")
  await page.locator("select[name=slot]").selectOption({ label: "CROSS26 · Sun 27 Dec · Morning" })
  await page.getByRole("button", { name: "Show" }).click()
  await expect(page.getByText("Akara & Pap · Regular").first()).toBeVisible()

  await page.goto(`/admin/dispatch?ref=${reference}`)
  await expect(page.getByRole("heading", { name: "Scan a pass" })).toBeVisible()
  await page.getByRole("button", { name: "Mark delivered" }).first().click()
  await expect(page.getByText("delivered").first()).toBeVisible()
})
