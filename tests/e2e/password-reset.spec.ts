import {expect,test} from "@playwright/test";

test.describe("Password reset",()=>{
 test("shows an invalid state when the token is missing",async({page})=>{
  await page.goto("/reset-password");
  await expect(page.getByRole("heading",{name:"This reset link isn’t valid."})).toBeVisible();
  await expect(page.getByRole("button",{name:"Back to Life Admin"})).toBeVisible();
 });

 test("validates new password length and confirmation",async({page})=>{
  await page.goto("/reset-password?token=test-token");
  await expect(page.getByRole("heading",{name:"Choose a new password"})).toBeVisible();

  await page.getByLabel("New password").fill("short");
  await page.getByLabel("Confirm password").fill("short");
  await page.getByRole("button",{name:"Update password"}).click();
  await expect(page.locator(".auth-error")).toContainText("at least 12 characters");

  await page.getByLabel("New password").fill("LifeAdmin-Test-2026!");
  await page.getByLabel("Confirm password").fill("LifeAdmin-Test-2025!");
  await page.getByRole("button",{name:"Update password"}).click();
  await expect(page.locator(".auth-error")).toContainText("Passwords do not match");
 });

 test("submits the token and new password and shows success",async({page})=>{
  let received:{token?:string;password?:string}|null=null;

  await page.route("**/api/v1/auth/password-reset/confirm",async route=>{
   received=route.request().postDataJSON() as {token?:string;password?:string};
   await route.fulfill({
    status:200,
    contentType:"application/json",
    body:JSON.stringify({message:"Your password has been updated. You can now sign in."}),
   });
  });

  await page.goto("/reset-password?token=ui-test-token");
  await page.getByLabel("New password").fill("LifeAdmin-Reset-2026!");
  await page.getByLabel("Confirm password").fill("LifeAdmin-Reset-2026!");
  await page.getByRole("button",{name:"Update password"}).click();

  await expect(page.getByRole("heading",{name:"You’re ready to sign in."})).toBeVisible();
  expect(received).toEqual({token:"ui-test-token",password:"LifeAdmin-Reset-2026!"});
  await expect(page.getByRole("button",{name:"Back to Life Admin"})).toBeVisible();
 });

 test("surfaces an expired or invalid token returned by the API",async({page})=>{
  await page.route("**/api/v1/auth/password-reset/confirm",async route=>{
   await route.fulfill({
    status:400,
    contentType:"application/json",
    body:JSON.stringify({message:"Reset link is invalid or has expired"}),
   });
  });

  await page.goto("/reset-password?token=expired-token");
  await page.getByLabel("New password").fill("LifeAdmin-Reset-2026!");
  await page.getByLabel("Confirm password").fill("LifeAdmin-Reset-2026!");
  await page.getByRole("button",{name:"Update password"}).click();

  await expect(page.locator(".auth-error")).toContainText("invalid or has expired");
  await expect(page.getByRole("heading",{name:"Choose a new password"})).toBeVisible();
 });
});
