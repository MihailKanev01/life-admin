import { expect, test, type Page } from "@playwright/test";
import { createAccountAndFinishWalkthrough, makeTestAccount } from "./test-helpers";

async function openAuth(page: Page, mode: "create" | "login") {
  if (mode === "create") {
    await page.getByRole("button", { name: "Create your account" }).first().click();
  } else {
    await page.getByRole("button", { name: "Sign in", exact: true }).first().click();
  }
  await expect(page.locator(".auth-overlay")).toBeVisible();
}

async function saveThing(page: Page, name: string, type: string, detail: string) {
  await page.getByRole("button", { name: "+ Add thing", exact: true }).click();
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Type").selectOption({ label: type });
  await page.getByLabel("Detail").fill(detail);
  await page.getByRole("button", { name: "Save thing", exact: true }).click();
  await expect(page.getByRole("button", { name: new RegExp(name, "i") })).toBeVisible();
}

async function savePayment(
  page: Page,
  name: string,
  type: string,
  amount: string,
  frequency: string,
  dueDate: string,
  thingName?: string,
) {
  await page.getByRole("button", { name: "+ Add payment", exact: true }).click();
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Type").selectOption({ label: type });
  await page.getByLabel("Amount").fill(amount);
  await page.getByLabel("Frequency").selectOption({ label: frequency });
  await page.getByLabel("Next due date").fill(dueDate);
  await page
    .getByLabel("Connected Thing")
    .selectOption(thingName ? { label: thingName } : { label: "None" });
  await page.getByRole("button", { name: "Save payment", exact: true }).click();
  await expect(page.getByText(name, { exact: true })).toBeVisible();
}

test.describe("Life Admin comprehensive functional coverage", () => {
  test("validates authentication inputs and switches all auth modes", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        name: "Keep the real-world admin of your life in one place.",
      }),
    ).toBeVisible();

    await openAuth(page, "create");
    const overlay = page.locator(".auth-overlay");

    await overlay.getByLabel("Email address").fill("bad-email");
    await overlay.getByRole("button", { name: "Create account", exact: true }).click();
    await expect(overlay.getByRole("alert")).toContainText("valid email");

    await overlay.getByLabel("Email address").fill("valid@example.com");
    await overlay.getByLabel("Your name").fill("A");
    await overlay
      .getByRole("textbox", { name: "Password", exact: true })
      .fill("short");
    await overlay
      .getByRole("textbox", { name: "Confirm password", exact: true })
      .fill("different");
    await overlay.getByRole("button", { name: "Create account", exact: true }).click();
    await expect(overlay.getByRole("alert")).toContainText("Enter your name");

    await overlay.getByLabel("Your name").fill("Valid User");
    await overlay.getByRole("button", { name: "Create account", exact: true }).click();
    await expect(overlay.getByRole("alert")).toContainText("12 characters");

    await overlay
      .getByRole("textbox", { name: "Password", exact: true })
      .fill("LifeAdmin-Test-2026!");
    await overlay
      .getByRole("textbox", { name: "Confirm password", exact: true })
      .fill("LifeAdmin-Test-2025!");
    await overlay.getByRole("button", { name: "Create account", exact: true }).click();
    await expect(overlay.getByRole("alert")).toContainText("Passwords do not match");

    await overlay
      .getByRole("button", { name: "Already have an account? Sign in" })
      .click();
    await expect(
      overlay.getByRole("heading", { name: "Sign in to Life Admin" }),
    ).toBeVisible();

    await overlay.getByLabel("Email address").fill("bad-email");
    await overlay.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(overlay.getByRole("alert")).toContainText("Enter a valid email");

    await overlay.getByLabel("Email address").fill("nope@example.com");
    await overlay.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(overlay.getByRole("alert")).toContainText("Enter your password");

    await overlay
      .getByRole("button", { name: "Forgot your password?", exact: true })
      .click();
    await expect(
      overlay.getByRole("heading", { name: "Forgot your password?" }),
    ).toBeVisible();
    await overlay.getByLabel("Email address").fill("valid@example.com");
    await overlay
      .getByRole("button", { name: "Send reset link", exact: true })
      .click();
    await expect(overlay.getByRole("status")).toContainText("If an account exists");

    await overlay.getByRole("button", { name: "Back to sign in" }).click();
    await expect(
      overlay.getByRole("heading", { name: "Sign in to Life Admin" }),
    ).toBeVisible();
  });

  test("covers landing CTAs, preview tabs, quick-add empty state, close and reset", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "See how it works", exact: true }).click();
    await expect(page.locator("#landing-preview")).toBeVisible();
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

    const tabs = page.locator(".landing-window-nav");
    for (const name of ["Home", "Things", "Payments", "Search"]) {
      await tabs.getByRole("button", { name: new RegExp(name) }).click();
      await expect(
        tabs.getByRole("button", { name: new RegExp(name) }),
      ).toHaveAttribute("aria-pressed", "true");
    }

    await tabs.getByRole("button", { name: /Home/ }).click();
    await page
      .locator(".landing-window-top")
      .getByRole("button", { name: "+ Quick add", exact: true })
      .click();
    const quick = page.getByRole("heading", {
      name: "What do you want to remember?",
    });
    await expect(quick).toBeVisible();

    const input = page.getByPlaceholder("e.g. Car insurance expires June 14");
    await input.fill("");
    await expect(
      page.getByRole("button", { name: "Review details", exact: true }),
    ).toBeDisabled();

    await page
      .locator(".landing-quick-card")
      .getByRole("button", { name: "Close preview" })
      .click();
    await expect(quick).toHaveCount(0);

    await page
      .locator(".landing-window-top")
      .getByRole("button", { name: "+ Quick add", exact: true })
      .click();
    await page
      .getByPlaceholder("e.g. Car insurance expires June 14")
      .fill("Netflix subscription €14.99 December 18");
    await page.getByRole("button", { name: "Review details", exact: true }).click();
    await expect(page.getByText("Payment", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Recurring payment", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Save to Life Admin", exact: true }).click();
    await expect(page.getByRole("status")).toContainText(
      "Saved to the demo preview.",
    );
    await page.getByRole("button", { name: "Try again", exact: true }).click();
    await page
      .locator(".landing-window-top")
      .getByRole("button", { name: "+ Quick add", exact: true })
      .click();
    await expect(
      page.getByPlaceholder("e.g. Car insurance expires June 14"),
    ).toHaveValue("Car insurance expires December 14");
    await page
      .locator(".landing-quick-card")
      .getByRole("button", { name: "Close preview" })
      .click();

    await page
      .locator(".landing-hero-copy")
      .getByRole("button", { name: /Create your account/ })
      .click();
    await expect(
      page
        .locator(".auth-overlay")
        .getByRole("heading", { name: "Create your account" }),
    ).toBeVisible();
    await page
      .locator(".auth-overlay")
      .getByRole("button", { name: "Close", exact: true })
      .click();
    await expect(page.locator(".auth-overlay")).toHaveCount(0);

    await page
      .locator(".landing-nav")
      .getByRole("button", { name: "Sign in", exact: true })
      .click();
    await expect(
      page
        .locator(".auth-overlay")
        .getByRole("heading", { name: "Sign in to Life Admin" }),
    ).toBeVisible();
  });

  test("covers walkthrough back/skip and all Product Tour steps including Back", async ({
    page,
  }) => {
    const account = makeTestAccount("Tour coverage");
    await page.goto("/");
    await page.getByRole("button", { name: "Create your account" }).first().click();
    const overlay = page.locator(".auth-overlay");
    await overlay.getByLabel("Your name").fill(account.name);
    await overlay.getByLabel("Email address").fill(account.email);
    await overlay
      .getByRole("textbox", { name: "Password", exact: true })
      .fill(account.password);
    await overlay
      .getByRole("textbox", { name: "Confirm password", exact: true })
      .fill(account.password);
    await overlay.getByRole("button", { name: "Create account", exact: true }).click();

    await expect(
      page.getByRole("heading", { name: "Your life admin, without the mental load." }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Your life admin, without the mental load." }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Skip walkthrough" }).click();
    await expect(
      page.getByRole("heading", { name: "Good afternoon, " + account.name }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Account" }).click();
    await page
      .getByRole("button", { name: "Replay walkthrough", exact: true })
      .click();

    const titles = [
      "Home keeps you focused.",
      "Quick Add is the fastest way in.",
      "Things connect your real life.",
      "Payments show what leaves your account.",
      "Search finds what you saved.",
      "Make the workspace yours.",
      "Your account is your control center.",
    ];
    for (const [index, title] of titles.entries()) {
      await expect(page.getByRole("heading", { name: title })).toBeVisible();
      if (index < titles.length - 1) {
        await page.getByRole("button", { name: "Next", exact: true }).click();
      }
    }
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Make the workspace yours." }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await expect(page.locator(".product-tour")).toHaveCount(0);
  });

  test("covers every Thing type, search filtering, details and connected reminder", async ({
    page,
  }) => {
    await createAccountAndFinishWalkthrough(page);

    await page.getByRole("button", { name: /Things/i }).first().click();
    for (const [type, name, detail] of [
      ["Vehicle", "Coverage Car", "120000 km"],
      ["Home", "Coverage Home", "Primary"],
      ["Device", "Coverage Laptop", "MacBook Pro"],
      ["Pet", "Coverage Pet", "Mixed breed"],
      ["Other", "Coverage Other", "Misc"],
    ]) {
      await saveThing(page, name, type, detail);
    }

    const thingsSearch = page.getByPlaceholder("Search things...");
    await thingsSearch.fill("Coverage Laptop");
    await expect(
      page.getByRole("button", { name: /Coverage Laptop/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Coverage Car/i }),
    ).toHaveCount(0);
    await thingsSearch.fill("");
    await expect(page.getByText("5 things", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: /Coverage Car/i }).click();
    await expect(
      page.getByRole("heading", { name: "Coverage Car" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Close", exact: true }).click();

    await page.getByRole("button", { name: /Coverage Car/i }).click();
    await page
      .getByRole("button", { name: /Add something to Coverage Car/i })
      .click();
    await expect(
      page.getByPlaceholder("e.g. Car insurance expires June 14"),
    ).toHaveValue("Car insurance expires December 14");
    await page.getByRole("button", { name: "Review details" }).click();
    await page.getByRole("button", { name: "Save to Life Admin" }).click();
    await expect(
      page.getByRole("button", { name: /Coverage Car/i }),
    ).toContainText("1 attention");
  });

  test("covers all Payment types/frequencies, validation, connected Thing and mark-paid", async ({
    page,
  }) => {
    await createAccountAndFinishWalkthrough(page);

    await page.getByRole("button", { name: /Things/i }).first().click();
    await saveThing(page, "Billing Car", "Vehicle", "Billing test");
    await page.getByRole("button", { name: /Payments/i }).first().click();

    await page.getByRole("button", { name: "+ Add payment", exact: true }).click();
    await page.getByRole("button", { name: "Save payment", exact: true }).click();
    await expect(page.locator(".app-error")).toContainText(
      "Give this payment a name",
    );
    await page.getByRole("button", { name: "Cancel", exact: true }).click();

    await savePayment(
      page,
      "Monthly Bill",
      "Bill",
      "25",
      "Every month",
      "2026-11-12",
      "Billing Car",
    );
    await savePayment(
      page,
      "Yearly Subscription",
      "Subscription",
      "120",
      "Every year",
      "2027-12-12",
    );
    await savePayment(
      page,
      "Weekly Renewal",
      "Renewal",
      "10",
      "Every week",
      "2026-11-20",
    );

    await expect(page.locator(".pay").filter({ hasText: "Monthly Bill" })).toContainText("Connected to a Thing");
    await expect(page.locator(".pay").filter({ hasText: "Monthly Bill" })).toContainText("Every month");
    await expect(page.locator(".pay").filter({ hasText: "Yearly Subscription" })).toContainText("Every year");
    await expect(page.locator(".pay").filter({ hasText: "Weekly Renewal" })).toContainText("Every week");

    const monthly = page.locator(".pay").filter({ hasText: "Monthly Bill" });
    await monthly.getByRole("button", { name: "Mark paid", exact: true }).click();
    await expect(monthly).toContainText("Dec 12");

    const yearly = page.locator(".pay").filter({ hasText: "Yearly Subscription" });
    await yearly.getByRole("button", { name: "Mark paid", exact: true }).click();
    await expect(yearly).toContainText("Dec 12");

    const weekly = page.locator(".pay").filter({ hasText: "Weekly Renewal" });
    await weekly.getByRole("button", { name: "Mark paid", exact: true }).click();
    await expect(weekly).toContainText("Nov 27");
  });

  test("covers Quick Add proposal variants and Search chips", async ({ page }) => {
    await createAccountAndFinishWalkthrough(page);

    const openQuick = async (textValue: string) => {
      await page.getByRole("button", { name: /\+(?: Quick add| Add)/i }).first().click();
      await page
        .getByPlaceholder("e.g. Car insurance expires June 14")
        .fill(textValue);
      await page
        .getByRole("button", { name: "Review details", exact: true })
        .click();
    };

    await openQuick("Add a thing");
    await expect(page.getByText("Thing", { exact: true }).last()).toBeVisible();
    await page.getByRole("button", { name: "Save to Life Admin" }).click();
    await page.getByRole("button", { name: /Things/i }).first().click();
    await expect(page.getByRole("button", { name: /New thing/i })).toBeVisible();

    await openQuick("Add a payment");
    await expect(page.getByText("Payment", { exact: true }).last()).toBeVisible();
    await page.getByRole("button", { name: "Save to Life Admin" }).click();
    await expect(
      page.getByRole("heading", { name: "Add a recurring payment" }),
    ).toBeVisible();
    await page.getByLabel("Name").fill("Quick Payment");
    await page.getByLabel("Amount").fill("19.99");
    await page.getByRole("button", { name: "Save payment", exact: true }).click();
    await page.getByRole("button", { name: /Payments/i }).first().click();
    await expect(page.getByText("Quick Payment", { exact: true })).toBeVisible();

    await openQuick("Add a document");
    await expect(page.getByText("Document", { exact: true }).last()).toBeVisible();
    await page.getByRole("button", { name: "Save to Life Admin" }).click();
    await page.getByRole("button", { name: /Home/i }).first().click();
    await expect(page.getByRole("button", { name: /New document/i })).toBeVisible();

    await openQuick("Car service due November 21");
    await expect(page.getByText("Reminder", { exact: true }).last()).toBeVisible();
    await page.getByRole("button", { name: "Save to Life Admin" }).click();

    await page.getByRole("button", { name: /Search your life/i }).click();
    await expect(
      page.getByRole("heading", { name: "Find anything you saved" }),
    ).toBeVisible();

    for (const chip of ["Mazda", "Insurance", "Internet", "Warranty"]) {
      await page.getByRole("button", { name: chip, exact: true }).click();
      await expect(
        page.getByPlaceholder(/Try “car”/i),
      ).toHaveValue(chip);
    }

    const searchInput = page.getByPlaceholder(/Try “car”/i);
    await searchInput.fill("Quick Payment");
    await expect(page.locator(".result").filter({ hasText: "Quick Payment" })).toContainText("Payment");

    await searchInput.fill("Car service");
    await expect(page.locator(".result").filter({ hasText: "Car service" })).toContainText("Reminder");

    await searchInput.fill("New thing");
    await expect(page.locator(".result").filter({ hasText: "New thing" })).toContainText("Thing");

    await searchInput.fill("");
    await expect(page.locator(".result")).toHaveCount(0);
  });

  test("archives a Thing without deleting its data and persists the archive across reload", async ({ page }) => {
    await createAccountAndFinishWalkthrough(page);

    await page.getByRole("button", { name: /Things/i }).first().click();
    await saveThing(page, "Archive Persistence Car", "Vehicle", "Archive persistence E2E");

    await page.getByRole("button", { name: /Archive Persistence Car/i }).click();
    await expect(page.getByRole("heading", { name: "Archive Persistence Car" })).toBeVisible();

    page.once("dialog", dialog => dialog.accept());
    await page.getByRole("button", { name: "Archive Thing", exact: true }).click();

    await expect(page.getByRole("button", { name: /Archive Persistence Car/i })).toHaveCount(0);
    await page.reload();
    await page.getByRole("button", { name: /Things/i }).first().click();
    await expect(page.getByRole("button", { name: /Archive Persistence Car/i })).toHaveCount(0);

    await saveThing(page, "Archive Persistence Car", "Vehicle", "New active Thing with reused name");
    await expect(page.getByRole("button", { name: /Archive Persistence Car/i })).toBeVisible();
  });

  test("persists theme preference across reload and keeps public landing after sign out", async ({
    page,
  }) => {
    const account = await createAccountAndFinishWalkthrough(page);

    await page.getByRole("button", { name: "Switch to dark mode" }).click();
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.getByRole("button", { name: "Switch to light mode" }).click();

    await page.getByRole("button", { name: "Account" }).click();
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(
      page.getByRole("heading", {
        name: "Keep the real-world admin of your life in one place.",
      }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(
      page
        .locator(".auth-overlay")
        .getByRole("heading", { name: "Sign in to Life Admin" }),
    ).toBeVisible();
    await page
      .locator(".auth-overlay")
      .getByLabel("Email address")
      .fill(account.email);
    await page
      .locator(".auth-overlay")
      .getByRole("textbox", { name: "Password", exact: true })
      .fill(account.password);
    await page
      .locator(".auth-overlay")
      .getByRole("button", { name: "Sign in", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Good afternoon, " + account.name }),
    ).toBeVisible();
  });

  test("uploads documents linked to a Thing and persists them until deletion", async ({ page }) => {
    await createAccountAndFinishWalkthrough(page);
    await page.locator('.sidebar nav button[data-tour="things"]').click();
    await saveThing(page, "Document Test Vehicle", "Vehicle", "Document linkage fixture");
    await page.locator(".thing").filter({ hasText: "Document Test Vehicle" }).click();
    await page.getByRole("button", { name: /Open related documents/ }).click();
    await expect(page.getByRole("heading", { name: "Documents", exact: true })).toBeVisible();
    await page.getByLabel("Choose document").setInputFiles({
      name: "vehicle-insurance.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.7\\nLife Admin E2E document fixture\\n", "utf8"),
    });
    await page.getByLabel("Link to a Thing").selectOption({ label: "Document Test Vehicle" });
    await page.getByRole("button", { name: "Upload document", exact: true }).click();

    const row = page.locator(".document-row").filter({ hasText: "vehicle-insurance.pdf" });
    await expect(row).toBeVisible();
    await expect(row).toContainText("Document Test Vehicle");
    await expect(row).toContainText("PDF");
    await expect(row).toContainText("Ready");

    await page.locator('.sidebar nav button[data-tour="search"]').click();
    await page.getByPlaceholder(/Try.*car.*insurance/i).fill("vehicle-insurance.pdf");
    await expect(page.getByText("vehicle-insurance.pdf", { exact: true })).toBeVisible();

    await page.locator('.sidebar nav button[data-tour="things"]').click();
    await page.locator(".thing").filter({ hasText: "Document Test Vehicle" }).click();
    await page.getByRole("button", { name: /Open related documents/ }).click();
    await expect(page.locator(".document-row").filter({ hasText: "vehicle-insurance.pdf" })).toBeVisible();
    await page.reload();
    await page.locator('.sidebar nav button[data-tour="things"]').click();
    await page.locator(".thing").filter({ hasText: "Document Test Vehicle" }).click();
    await page.getByRole("button", { name: /Open related documents/ }).click();
    const persistedRow = page.locator(".document-row").filter({ hasText: "vehicle-insurance.pdf" });
    await expect(persistedRow).toBeVisible();

    page.once("dialog", dialog => dialog.accept());
    await persistedRow.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(persistedRow).toHaveCount(0);
  });

});
