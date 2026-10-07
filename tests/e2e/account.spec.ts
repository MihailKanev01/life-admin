import {expect, test} from "@playwright/test";
import {createAccountAndFinishWalkthrough, testAccountA, testAccountB} from "./test-helpers";

test.describe("Life Admin account and onboarding", () => {
  test("requires an account and shows the walkthrough after registration", async ({page}) => {
    await page.goto("/");

    await expect(page.getByRole("heading",{name:"Create your account"})).toBeVisible();
    await page.getByLabel("Your name").fill(testAccountA.name);
    await page.getByLabel("Email address").fill(testAccountA.email);
    await page.getByRole("button",{name:"Create account"}).click();

    await expect(page.getByRole("heading",{name:"Your life admin, without the mental load."})).toBeVisible();
    await expect(page.getByRole("button",{name:"Next"})).toBeVisible();
    await page.getByRole("button",{name:"Next"}).click();

    await expect(page.getByRole("heading",{name:"Start with what you manage."})).toBeVisible();
    await page.getByRole("button",{name:"Next"}).click();

    await expect(page.getByRole("heading",{name:"Tell us naturally."})).toBeVisible();
    await page.getByRole("button",{name:"Next"}).click();

    await expect(page.getByRole("heading",{name:"Know what deserves your attention."})).toBeVisible();
    await page.getByRole("button",{name:"Start using Life Admin"}).click();

    await expect(page.getByRole("heading",{name:"Good afternoon, "+testAccountA.name})).toBeVisible();
  });

  test("keeps personal data separated between accounts and restores it after sign in", async ({page}) => {
    await createAccountAndFinishWalkthrough(page,testAccountA);

    await expect(page.getByRole("button",{name:/Passport renewal/i})).toBeVisible();

    await page.getByRole("button",{name:"Account"}).click();
    await page.getByRole("button",{name:"Sign out"}).click();
    await expect(page.getByRole("heading",{name:"Create your account"})).toBeVisible();

    await page.getByLabel("Your name").fill(testAccountB.name);
    await page.getByLabel("Email address").fill(testAccountB.email);
    await page.getByRole("button",{name:"Create account"}).click();
    await page.getByRole("button",{name:"Skip walkthrough"}).click();

    await expect(page.getByRole("heading",{name:"Good afternoon, "+testAccountB.name})).toBeVisible();
    await expect(page.getByRole("button",{name:/Passport renewal/i})).toHaveCount(0);

    await page.getByRole("button",{name:"Account"}).click();
    await page.getByRole("button",{name:"Sign out"}).click();
    await page.getByRole("button",{name:/Already have an account\? Sign in/i}).click();
    await page.getByLabel("Email address").fill(testAccountA.email);
    await page.getByRole("button",{name:"Sign in"}).click();

    await expect(page.getByRole("heading",{name:"Good afternoon, "+testAccountA.name})).toBeVisible();
    await expect(page.getByRole("button",{name:/Passport renewal/i})).toBeVisible();
  });
});
