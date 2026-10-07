import { expect, test } from "@playwright/test";

test.describe("Life Admin mobile prototype", () => {
  test("keeps primary navigation and Quick Add usable on mobile", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator(".mobileNav")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Good afternoon, Mihail" })).toBeVisible();

    await page.locator(".mobileNav").getByRole("button", { name: "Things" }).click();
    await expect(page.getByRole("heading", { name: "Your real life, organized" })).toBeVisible();

    await page.locator(".mobileNav").getByRole("button", { name: /Add/ }).click();
    await expect(
      page.getByRole("heading", { name: "What do you want to remember?" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "×" }).click();

    await page.locator(".mobileNav").getByRole("button", { name: "Payments" }).click();
    await expect(page.getByRole("heading", { name: "Know what leaves your account" })).toBeVisible();
  });
});
