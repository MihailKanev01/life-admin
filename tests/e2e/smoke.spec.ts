import {addPayment,addReminder,addThing,createAccountAndFinishWalkthrough,makeTestAccount} from "./test-helpers";
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
    await expect(page.locator(".sheet .modalcopy").filter({hasText:"Due Dec 14"})).toBeVisible();
    await page.getByRole("button", { name: "Close" }).click();
  });

  test("shows an interactive product tour and can replay it", async ({ page }) => {
    await createAccountAndFinishWalkthrough(page);

    await page.evaluate(() => {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith("life-admin-product-tour-")) localStorage.removeItem(key);
      }
    });
    await page.reload();

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

  test("explains when a registration email is already in use", async ({ page }) => {
    const account = makeTestAccount("duplicate");
    await createAccountAndFinishWalkthrough(page, account);

    await page.locator(".sidebar").getByRole("button", { name: /Account/ }).click();
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();

    const csrfState = await page.evaluate(async () => {
      const response = await fetch("/api/v1/auth/csrf", { credentials: "include", cache: "no-store" });
      const data = await response.json() as { token?: string };
      const cookie = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/)?.[1] ?? "";
      return { responseStatus: response.status, tokenLength: data.token?.length ?? 0, cookieLength: cookie.length, matches: Boolean(data.token) && decodeURIComponent(cookie) === data.token };
    });
    const csrfCookies = (await page.context().cookies()).filter(cookie => cookie.name === "XSRF-TOKEN").map(cookie => ({
      domain: cookie.domain, path: cookie.path, secure: cookie.secure, httpOnly: cookie.httpOnly, sameSite: cookie.sameSite, valueLength: cookie.value.length
    }));
    console.log("CSRF state after logout", csrfState, csrfCookies);

    await page.getByLabel("Your name").fill(account.name);
    await page.getByLabel("Email address").fill(account.email);
    await page.getByRole("textbox", { name: "Password", exact: true }).fill(account.password);
    await page.getByRole("textbox", { name: "Confirm password", exact: true }).fill(account.password);
    const registerResponsePromise = page.waitForResponse(response =>
      response.url().includes("/api/v1/auth/register") &&
      response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    const registerResponse = await registerResponsePromise;
    console.log("Duplicate registration response", registerResponse.status(), await registerResponse.text());

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