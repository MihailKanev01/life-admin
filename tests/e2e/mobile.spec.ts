import {addThing,createAccountAndFinishWalkthrough} from "./test-helpers";
import { expect, test, type Page } from "@playwright/test";

async function expectMobileLayoutFits(page:Page,label:string){
  const metrics=await page.evaluate(()=>{
    const viewportWidth=document.documentElement.clientWidth;
    const selectors=["body",".shell","header",".page",".intro",".panel",".list",".mobileNav",".backdrop .sheet",".auth-overlay .auth-card",".landing-page",".landing-nav",".landing-hero","#landing-preview",".landing-window",".landing-window-content",".documents-page",".document-row"];
    const overflow=selectors.flatMap(selector=>Array.from(document.querySelectorAll<HTMLElement>(selector)).map(element=>{
      const rect=element.getBoundingClientRect();
      return {selector,left:Math.round(rect.left),right:Math.round(rect.right),width:Math.round(rect.width)};
    }).filter(rect=>rect.width>0&&(rect.left < -1 || rect.right > viewportWidth+1)));
    return {viewportWidth,documentWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,overflow};
  });
  expect(metrics.documentWidth,`${label}: document overflows the viewport`).toBeLessThanOrEqual(metrics.viewportWidth+1);
  expect(metrics.bodyWidth,`${label}: body overflows the viewport`).toBeLessThanOrEqual(metrics.viewportWidth+1);
  expect(metrics.overflow,`${label}: content is wider than the viewport`).toEqual([]);
}


test.describe("Life Admin mobile prototype", () => {
  test("keeps primary navigation and Quick Add usable on mobile", async ({ page }) => {
    await createAccountAndFinishWalkthrough(page);

    await expect(page.locator(".mobileNav")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Good afternoon, Mihail" })).toBeVisible();

    await page.locator(".mobileNav").getByRole("button", { name: "Things" }).click();
    await expect(page.getByRole("heading", { name: "Your real life, organized" })).toBeVisible();

    await page.locator(".mobileNav .mobadd").click();
    await expect(
      page.getByRole("heading", { name: "What do you want to remember?" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "×" }).click();

    await page.locator(".mobileNav").getByRole("button", { name: "Payments" }).click();
    await expect(page.getByRole("heading", { name: "Know what leaves your account" })).toBeVisible();
  });
});


test.describe("Life Admin responsive layout safeguards", () => {
  test("public landing and interactive preview fit common phone widths", async ({ page }) => {
    for (const width of [320, 360, 375, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/");
      await expect(page.getByRole("heading", { name: "Your reminders, bills and important things. All in one place." })).toBeVisible();
      await expectMobileLayoutFits(page, `public landing at ${width}px`);

      await page.locator(".landing-window-nav").getByRole("button", { name: /Search/ }).click();
      const sampleSearch=page.getByRole("searchbox", { name: "Search the sample workspace" });
      await expect(sampleSearch).toBeVisible();
      await sampleSearch.fill("netflix");
      await expect(page.getByText("Netflix", { exact: true })).toBeVisible();
      await expectMobileLayoutFits(page, `search preview at ${width}px`);

      await page.locator(".landing-window-nav").getByRole("button", { name: /Home/ }).click();
      await page.locator(".landing-window-top").getByRole("button", { name: "Search the example workspace" }).click();
      await expect(page.locator(".landing-window-nav").getByRole("button", { name: /Search/ })).toBeVisible();
      await page.locator(".landing-window-top").getByRole("button", { name: "+ Quick add", exact: true }).click().catch(()=>{});
      await expectMobileLayoutFits(page, `quick actions at ${width}px`);
    }
  });

  test("workspace, long labels, navigation and modal stay inside a narrow phone viewport", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await createAccountAndFinishWalkthrough(page);
    await expectMobileLayoutFits(page, "home at 320px");

    const longName="Vehicle insurance and registration documents";
    const longDetail="Annual insurance policy, vehicle registration and service documentation kept together";
    await addThing(page, longName, "Vehicle", longDetail);
    await expectMobileLayoutFits(page, "thing card with long text at 320px");

    await page.locator(".mobileNav").getByRole("button", { name: "Payments" }).click();
    await expect(page.getByRole("heading", { name: "Know what leaves your account" })).toBeVisible();
    await expectMobileLayoutFits(page, "payments at 320px");

    await page.locator(".mobileNav").getByRole("button", { name: "Search" }).click();
    await expect(page.getByRole("heading", { name: "Search your life" })).toBeVisible();
    await expectMobileLayoutFits(page, "search at 320px");

    await page.locator(".mobileNav .mobadd").click();
    await expect(page.getByRole("heading", { name: "What do you want to remember?" })).toBeVisible();
    await expectMobileLayoutFits(page, "Quick Add sheet at 320px");
    await page.getByRole("button", { name: "×" }).click();

    await page.getByRole("button", { name: "Open account" }).click();
    await expect(page.locator(".account-sheet")).toBeVisible();
    await expectMobileLayoutFits(page, "account sheet at 320px");
  });
});
