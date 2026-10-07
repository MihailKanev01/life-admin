import {expect, type Page} from "@playwright/test";

export const testAccountA={name:"Mihail Test",email:"mihail.a@example.com"};
export const testAccountB={name:"Alex Test",email:"alex.b@example.com"};

export async function createAccountAndFinishWalkthrough(page:Page,account=testAccountA){
 await page.goto("/");
 await expect(page.getByRole("heading",{name:"Create your account"})).toBeVisible();
 await page.getByLabel("Your name").fill(account.name);
 await page.getByLabel("Email address").fill(account.email);
 await page.getByRole("button",{name:"Create account"}).click();

 for(let index=0;index<3;index++){
  await page.getByRole("button",{name:"Next"}).click();
 }
 await page.getByRole("button",{name:"Start using Life Admin"}).click();
 await expect(page.getByRole("heading",{name:"Good afternoon, "+account.name})).toBeVisible();
}
