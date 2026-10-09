import { expect, test } from "@playwright/test";

test.describe("Life Admin color themes", () => {
  test("landing page theme toggle updates colors and persists the choice", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");

    const root = page.locator("html");
    await expect(root).toHaveAttribute("data-theme", "light");
    await expect(page.getByRole("button", { name: "Switch to dark mode" })).toBeVisible();

    await page.getByRole("button", { name: "Switch to dark mode" }).click();
    await expect(root).toHaveAttribute("data-theme", "dark");
    await expect(page.getByRole("button", { name: "Switch to light mode" })).toHaveAttribute("aria-pressed", "true");
    await expect.poll(async () => root.evaluate((element) => getComputedStyle(element).getPropertyValue("--canvas").trim())).toBe("#0c1424");
    await expect.poll(async () => root.evaluate((element) => getComputedStyle(element).getPropertyValue("--accent").trim())).toBe("#9db8ff");

    await page.reload();
    await expect(root).toHaveAttribute("data-theme", "dark");

    await page.getByRole("button", { name: "Switch to light mode" }).click();
    await expect(root).toHaveAttribute("data-theme", "light");
    await expect.poll(async () => root.evaluate((element) => getComputedStyle(element).getPropertyValue("--accent").trim())).toBe("#315dce");
  });
});
