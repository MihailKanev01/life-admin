import {addReminder,addThing,createAccountAndFinishWalkthrough} from "./test-helpers";
import { expect, test } from "@playwright/test";

test.describe("Life Admin prototype smoke", () => {
  test("renders Home and opens Quick Add", async ({ page }) => {
    await createAccountAndFinishWalkthrough(page);

    await expect(page.getByRole("heading", { name: "Good afternoon, Mihail" })).toBeVisible();
    await expect(page.getByText("Nothing urgent", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: /quick add/i }).first().click();

    await expect(
      page.getByRole("heading", { name: "What do you want to remember?" }),
    ).toBeVisible();
    const input = page.getByPlaceholder("e.g. Car insurance expires June 14");
    await expect(input).toBeVisible();
    await input.fill("Car insurance expires December 14");
    await page.getByRole("button", { name: "Review details" }).click();

    await expect(page.getByText("Car insurance", { exact: true }).last()).toBeVisible();
    await expect(page.getByText("Mazda 6", { exact: true }).last()).toBeVisible();
    await expect(page.getByText("December 14", { exact: true }).last()).toBeVisible();

    await page.getByRole("button", { name: "Save to Life Admin" }).click();
    await page.getByRole("button", { name: /Car insurance/i }).first().click();
    await expect(page.getByRole("heading", { name: "Car insurance" })).toBeVisible();
    await expect(page.getByText("Due Dec 14", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Close" }).click();
  });

  test("completes and snoozes attention items", async ({ page }) => {
    await createAccountAndFinishWalkthrough(page);
    await addReminder(page,"Internet payment due October 7");
    await addReminder(page,"Car insurance expires December 14");

    await page.getByRole("button", { name: /Internet payment/i }).click();
    await expect(page.getByRole("heading", { name: "Internet payment" })).toBeVisible();

    await page.getByRole("button", { name: "Done" }).click();
    await expect(page.getByRole("button", { name: /Internet payment/i })).toHaveCount(0);

    await page.getByRole("button", { name: /Car insurance/i }).click();
    await page.getByRole("button", { name: "Snooze until tomorrow" }).click();

    await expect(page.getByRole("button", { name: /Car insurance/i })).toContainText("Tomorrow");
  });

  test("navigates Things, Payments and Search", async ({ page }) => {
    await createAccountAndFinishWalkthrough(page);
    await addThing(page);

    await expect(page.getByRole("heading", { name: "Your real life, organized" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Mazda 6/i })).toBeVisible();

    await page.getByRole("button", { name: /Payments/i }).first().click();
    await expect(page.getByRole("heading", { name: "Know what leaves your account" })).toBeVisible();
    await expect(page.getByText("Internet", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: /Search your life/i }).click();
    await expect(page.getByRole("heading", { name: "Find anything you saved" })).toBeVisible();

    const search = page.getByPlaceholder(/Try “car”/i);
    await search.fill("insurance");
    await expect(page.getByText("Car insurance", { exact: true }).last()).toBeVisible();
  });

  test("opens a Thing and connects a reminder to it", async ({ page }) => {
    await createAccountAndFinishWalkthrough(page);
    await addThing(page);

    await page.getByRole("button", { name: /Mazda 6/i }).click();
    await expect(page.getByRole("heading", { name: "Mazda 6" })).toBeVisible();
    await expect(page.getByText("Nothing right now", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: /Add something to Mazda 6/i }).click();
    await expect(page.getByText("Quick add", { exact: true })).toBeVisible();
    await expect(page.getByPlaceholder("e.g. Car insurance expires June 14")).toHaveValue("Car insurance expires December 14");
    await page.getByRole("button", { name: "Review details" }).click();
    await page.getByRole("button", { name: "Save to Life Admin" }).click();

    await expect(page.getByRole("button", { name: /Car insurance/i })).toBeVisible();
    await page.getByRole("button", { name: /Things/i }).first().click();
    await page.getByRole("button", { name: /Mazda 6/i }).click();
    await expect(page.getByText("1 reminder", { exact: true })).toBeVisible();
  });

  test("toggles dark mode and back", async ({ page }) => {
    await createAccountAndFinishWalkthrough(page);

    const toggle = page.getByRole("button", { name: "Switch to dark mode" });
    await toggle.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByRole("button", { name: "Switch to light mode" })).toBeVisible();

    await page.getByRole("button", { name: "Switch to light mode" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  });

});
