import {addPayment,addReminder,addThing,createAccountAndFinishWalkthrough,makeTestAccount} from "./test-helpers";
import { expect, test } from "@playwright/test";

test.describe("Life Admin prototype smoke", () => {
  test("shows the public landing and interactive preview", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Keep the real-world admin of your life in one place." })).toBeVisible();
    await expect(page.getByText("Frontend only · mock data")).toBeVisible();

    await page.getByRole("button", { name: /Quick add/i }).first().click();
    await expect(page.getByRole("heading", { name: "What do you want to remember?" })).toBeVisible();
    const previewInput = page.getByPlaceholder("e.g. Car insurance expires June 14");
    await previewInput.fill("Car insurance expires December 14");
    await page.getByRole("button", { name: "Review details", exact: true }).click();
    await expect(page.getByText("Reminder", { exact: true })).toBeVisible();
    await expect(page.getByText("Mazda 6", { exact: true })).toBeVisible();
    await expect(page.getByText("December 14", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Save to Life Admin", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Saved to the demo preview.");

    await page.getByRole("button", { name: "Things", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Your real life, organized" })).toBeVisible();
    await page.getByRole("button", { name: "Payments", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Know what leaves your account" })).toBeVisible();
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Find anything you saved" })).toBeVisible();

    await page.getByRole("button", { name: "Create your account", exact: true }).first().click();
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
    await page.getByRole("button", { name: "Close", exact: true }).click();
  });

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
    await expect(page.locator(".sheet .modalcopy").filter({hasText:"Due Dec 14"})).toBeVisible();
    await page.getByRole("button", { name: "Close" }).click();
  });

  test("shows an interactive product tour and can replay it", async ({ page }) => {
    await createAccountAndFinishWalkthrough(page);

    await page.locator(".sidebar").getByRole("button", { name: /Account/ }).click();
    await page.getByRole("button", { name: "Replay walkthrough", exact: true }).click();

    await expect(page.getByRole("dialog", { name: "Home keeps you focused." })).toBeVisible();
    await expect(page.getByText("STEP 1 OF 7", { exact: true })).toBeVisible();
    await expect(page.locator(".product-tour-focus")).toBeVisible();
    await expect(page.locator(".product-tour-arrow")).toBeVisible();

    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Quick Add is the fastest way in." })).toBeVisible();
    await expect(page.getByText("STEP 2 OF 7", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Skip tour", exact: true }).click();
    await expect(page.locator(".product-tour")).toHaveCount(0);

    await page.locator(".sidebar").getByRole("button", { name: /Account/ }).click();
    await page.getByRole("button", { name: "Replay walkthrough", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Home keeps you focused." })).toBeVisible();
    await page.getByRole("button", { name: "Skip tour", exact: true }).click();
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

  test("shows forgot password recovery from sign in", async ({ page }) => {
    const account = makeTestAccount("recovery");
    await createAccountAndFinishWalkthrough(page, account);

    await page.locator(".sidebar").getByRole("button", { name: /Account/ }).click();
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await page.getByRole("button", { name: /Already have an account\? Sign in/i }).click();

    await page.getByRole("button", { name: "Forgot your password?", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Forgot your password?" })).toBeVisible();
    await page.getByLabel("Email address").fill(account.email);
    await page.getByRole("button", { name: "Send reset link", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("If an account exists for that email");
  });

  test("registers, signs out, signs in again and persists the session after reload", async ({ page }) => {
    const account = makeTestAccount("login");
    await createAccountAndFinishWalkthrough(page, account);

    await page.locator(".sidebar").getByRole("button", { name: /Account/ }).click();
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Keep the real-world admin of your life in one place." })).toBeVisible();
    await page.getByRole("button", { name: "Create your account" }).first().click();
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();

    await page.getByRole("button", { name: "Already have an account? Sign in" }).click();
    await expect(page.getByRole("heading", { name: "Sign in to Life Admin" })).toBeVisible();
    await page.getByLabel("Email address").fill(account.email);
    await page.getByRole("textbox", { name: "Password", exact: true }).fill(account.password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    await expect(page.getByRole("heading", { name: "Good afternoon, "+account.name })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { name: "Good afternoon, "+account.name })).toBeVisible();
  });

  test("shows the duplicate registration message", async ({ page }) => {
    const account = makeTestAccount("duplicate");
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Keep the real-world admin of your life in one place." })).toBeVisible();
    await page.getByRole("button", { name: "Create your account", exact: true }).first().click();
    await expect(page.locator(".auth-overlay").getByRole("heading", { name: "Create your account" })).toBeVisible();

    await page.route("**/api/v1/auth/*", async route => {
      if (route.request().method() !== "POST" || !route.request().url().endsWith("/api/v1/auth/register")) {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({
          detail: "An account with this email already exists",
        }),
      });
    });

    await page.getByLabel("Your name").fill(account.name);
    await page.getByLabel("Email address").fill(account.email);
    await page.getByRole("textbox", { name: "Password", exact: true }).fill(account.password);
    await page.getByRole("textbox", { name: "Confirm password", exact: true }).fill(account.password);
    await page.locator(".auth-overlay").getByRole("button", { name: "Create account", exact: true }).click();

    await expect(page.locator(".auth-error")).toContainText("already exists");
    await expect(page.locator(".auth-error")).toContainText("Forgot your password");
  });

  test("navigates Things, Payments and Search", async ({ page }) => {
    await createAccountAndFinishWalkthrough(page);
    await addThing(page);

    await expect(page.getByRole("heading", { name: "Your real life, organized" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Mazda 6/i })).toBeVisible();

    await addPayment(page);
    await expect(page.getByRole("heading", { name: "Know what leaves your account" })).toBeVisible();
    await expect(page.getByText("Internet", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Mark paid" }).click();
    await expect(page.getByText("Internet", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: /Search your life/i }).click();
    await expect(page.getByRole("heading", { name: "Find anything you saved" })).toBeVisible();

    const search = page.getByPlaceholder(/Try “car”/i);
    await search.fill("internet");
    await expect(page.getByText("Internet", { exact: true }).last()).toBeVisible();
  });

  test("opens a Thing and connects a reminder to it", async ({ page }) => {
    await createAccountAndFinishWalkthrough(page);
    await addThing(page);

    await page.getByRole("button", { name: /Mazda 6/i }).click();
    await expect(page.getByRole("heading", { name: "Mazda 6" })).toBeVisible();
    await expect(page.locator(".contextgrid").getByText("Nothing right now", { exact: true }).first()).toBeVisible();

    await page.getByRole("button", { name: /Add something to Mazda 6/i }).click();
    await expect(page.getByText("Quick add", { exact: true })).toBeVisible();
    await expect(page.getByPlaceholder("e.g. Car insurance expires June 14")).toHaveValue("Car insurance expires December 14");
    await page.getByRole("button", { name: "Review details" }).click();
    await page.getByRole("button", { name: "Save to Life Admin" }).click();

    await expect(page.locator(".thinggrid").getByRole("button", { name: /Mazda 6/i })).toContainText("1 attention");
    await page.getByRole("button", { name: /Mazda 6/i }).first().click();
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