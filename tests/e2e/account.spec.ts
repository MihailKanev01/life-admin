import {expect,test} from "@playwright/test";
import {addReminder,createAccountAndFinishWalkthrough,makeTestAccount} from "./test-helpers";

test.describe("Life Admin account and onboarding",()=>{
  test("requires an account and shows the walkthrough after registration",async({page})=>{
    const account=makeTestAccount("Mihail Test");
    await page.goto("/");

    await expect(page.getByRole("heading",{name:"Create your account"})).toBeVisible();
    await page.getByLabel("Your name").fill(account.name);
    await page.getByLabel("Email address").fill(account.email);
    await page.getByRole("textbox",{name:"Password",exact:true}).fill(account.password);
    await page.getByRole("textbox",{name:"Confirm password",exact:true}).fill(account.password);
    await page.getByRole("button",{name:"Create account"}).click();

    await expect(page.getByRole("heading",{name:"Your life admin, without the mental load."})).toBeVisible();
    await page.getByRole("button",{name:"Next",exact:true}).click();
    await expect(page.getByRole("heading",{name:"Start with what you manage."})).toBeVisible();
    await page.getByRole("button",{name:"Next",exact:true}).click();
    await expect(page.getByRole("heading",{name:"Tell us naturally."})).toBeVisible();
    await page.getByRole("button",{name:"Next",exact:true}).click();
    await expect(page.getByRole("heading",{name:"Know what deserves your attention."})).toBeVisible();
    await page.getByRole("button",{name:"Start using Life Admin"}).click();

    await expect(page.getByRole("heading",{name:"Good afternoon, "+account.name})).toBeVisible();
  });

  test("keeps personal data separated between accounts and restores it after sign in",async({page})=>{
    const accountA=makeTestAccount("Mihail A");
    const accountB=makeTestAccount("Alex B");

    await createAccountAndFinishWalkthrough(page,accountA);
    await addReminder(page,"Passport renewal September 22");
    await expect(page.getByRole("button",{name:/Passport renewal/i})).toBeVisible();

    await page.getByRole("button",{name:"Account"}).click();
    await page.getByRole("button",{name:"Sign out"}).click();
    await expect(page.getByRole("heading",{name:"Create your account"})).toBeVisible();

    await page.getByLabel("Your name").fill(accountB.name);
    await page.getByLabel("Email address").fill(accountB.email);
    await page.getByRole("textbox",{name:"Password",exact:true}).fill(accountB.password);
    await page.getByRole("textbox",{name:"Confirm password",exact:true}).fill(accountB.password);
    await page.getByRole("button",{name:"Create account"}).click();
    await page.getByRole("button",{name:"Skip walkthrough"}).click();

    await expect(page.getByRole("heading",{name:"Good afternoon, "+accountB.name})).toBeVisible();
    await expect(page.locator(".product-tour")).toHaveCount(0);
    await expect(page.getByRole("button",{name:/Passport renewal/i})).toHaveCount(0);

    await page.getByRole("button",{name:"Account"}).click();
    await page.getByRole("button",{name:"Sign out"}).click();
    await page.getByRole("button",{name:/Already have an account\? Sign in/i}).click();
    await page.getByLabel("Email address").fill(accountA.email);
    await page.getByLabel("Password").fill(accountA.password);
    await page.getByRole("button",{name:"Sign in"}).click();

    await expect(page.getByRole("heading",{name:"Good afternoon, "+accountA.name})).toBeVisible();
    await expect(page.getByRole("button",{name:/Passport renewal/i})).toBeVisible();
  });
});
