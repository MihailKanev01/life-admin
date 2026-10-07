import {expect,type Page} from "@playwright/test";

export type TestAccount={name:string;email:string;password:string};

export function makeTestAccount(label="user"):TestAccount{
 return {
  name:label==="user"?"Mihail":label,
  email:label.toLowerCase().replace(/[^a-z0-9]+/g,"-")+"-"+crypto.randomUUID().slice(0,8)+"@example.com",
  password:"LifeAdmin-Test-2026!",
 };
}

export async function createAccountAndFinishWalkthrough(
 page:Page,
 account:TestAccount=makeTestAccount(),
){
 await page.goto("/");
 await expect(page.getByRole("heading",{name:"Create your account"})).toBeVisible();
 await page.getByLabel("Your name").fill(account.name);
 await page.getByLabel("Email address").fill(account.email);
 await page.getByRole("textbox",{name:"Password",exact:true}).fill(account.password);
 await page.getByRole("textbox",{name:"Confirm password",exact:true}).fill(account.password);
 await page.getByRole("button",{name:"Create account"}).click();

 for(let index=0;index<3;index++){
  await page.getByRole("button",{name:"Next",exact:true}).click();
 }
 await page.getByRole("button",{name:"Start using Life Admin"}).click();
 await expect(page.getByRole("heading",{name:"Good afternoon, "+account.name})).toBeVisible();
 return account;
}

export async function addReminder(
 page:Page,
 textValue:string,
){
 await page.getByRole("button",{name:/Quick add/i}).first().click();
 await page.getByPlaceholder("e.g. Car insurance expires June 14").fill(textValue);
 await page.getByRole("button",{name:"Review details"}).click();
 await page.getByRole("button",{name:"Save to Life Admin"}).click();
}
