import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Life Admin accessibility smoke", () => {
  test("Home has no serious or critical accessibility violations in light mode", async ({ page }) => {
    await page.goto("/");

    const results = await new AxeBuilder({ page }).analyze();
    const seriousOrCritical = results.violations.filter(
      (violation) => violation.impact === "serious" || violation.impact === "critical",
    );

    expect(seriousOrCritical).toEqual([]);
  });

  test("Home has no serious or critical accessibility violations in dark mode", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Switch to dark mode" }).click();

    const results = await new AxeBuilder({ page }).analyze();
    const seriousOrCritical = results.violations.filter(
      (violation) => violation.impact === "serious" || violation.impact === "critical",
    );

    expect(seriousOrCritical).toEqual([]);
  });
});
