import {defineConfig,devices} from "@playwright/test";

export default defineConfig({
 testDir:"./tests/e2e",
 fullyParallel:true,
 forbidOnly:!!process.env.CI,
 retries:process.env.CI?2:0,
 workers:process.env.CI?1:undefined,
 reporter:process.env.CI?"dot":"html",
 use:{
  baseURL:"http://127.0.0.1:3000",
  trace:"on-first-retry",
  screenshot:"only-on-failure",
 },
 projects:[
  {name:"chromium",use:{...devices["Desktop Chrome"]},testMatch:/.*\.spec\.ts/,testIgnore:/mobile\.spec\.ts/},
  {name:"mobile-chromium",use:{...devices["Pixel 7"]},testMatch:/mobile\.spec\.ts/},
 ],
 webServer:{
  command:"npm run dev -- --hostname 127.0.0.1",
  url:"http://127.0.0.1:3000",
  reuseExistingServer:!process.env.CI,
  timeout:120_000,
  env:{NEXT_PUBLIC_API_BASE_URL:"http://127.0.0.1:8080/api/v1"},
 },
});
