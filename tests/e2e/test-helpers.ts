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
 await expect(page.getByRole("heading",{name:"Keep the real-world admin of your life in one place."})).toBeVisible();
 await page.getByRole("button",{name:"Create your account"}).first().click();
 await expect(page.getByRole("heading",{name:"Create your account"})).toBeVisible();
 await page.getByLabel("Your name").fill(account.name);
 await page.getByLabel("Email address").fill(account.email);
 await page.getByRole("textbox",{name:"Password",exact:true}).fill(account.password);
 await page.getByRole("textbox",{name:"Confirm password",exact:true}).fill(account.password);
 await page.getByRole("button",{name:"Create account"}).click();

 // Registration completes into the original 4-screen onboarding walkthrough.
 // Wait for its first heading before interacting so the ProductTour cannot race it.
 await expect(page.getByRole("heading",{name:"Your life admin, without the mental load."})).toBeVisible();
 for(let index=0;index<3;index++){
  await page.getByRole("button",{name:"Next",exact:true}).click();
 }
 await page.getByRole("button",{name:"Start using Life Admin",exact:true}).click();
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

export async function addThing(
 page:Page,
 name="Mazda 6",
 type="Vehicle",
 detail="235,420 km",
){
 await page.getByRole("button",{name:/Things/i}).first().click();
 await page.getByRole("button",{name:"+ Add thing",exact:true}).click();
 await page.getByLabel("Name").fill(name);
 await page.getByLabel("Type").selectOption({label:type});
 await page.getByLabel("Detail").fill(detail);
 await page.getByRole("button",{name:"Save thing",exact:true}).click();
 await expect(page.getByRole("button",{name:new RegExp(name,"i")})).toBeVisible();
}


export async function addPayment(
 page:Page,
 name="Internet",
 amount="25",
 frequency="Every month",
){
 await page.getByRole("button",{name:/Payments/i}).first().click();
 await page.getByRole("button",{name:"+ Add payment",exact:true}).click();
 await page.getByLabel("Name").fill(name);
 await page.getByLabel("Type").selectOption({label:"Bill"});
 await page.getByLabel("Amount").fill(amount);
 await page.getByLabel("Frequency").selectOption({label:frequency});
 await page.getByRole("button",{name:"Save payment",exact:true}).click();
 await expect(page.getByText(name,{exact:true})).toBeVisible();
}
