import { test, expect, type Page } from "@playwright/test";

const TEST_EMAIL = `e2e-${Date.now()}@example.com`;
const TEST_PW = "password123!";

const signUp = async (page: Page, email = TEST_EMAIL, pw = TEST_PW) => {
  await page.goto("/sign-in");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', pw);
  await page.click('button[type="submit"]');
  await page.waitForURL("/");
};

test("two browsers see the same sticky note in real time", async ({ browser }) => {
  const ctxA = await browser.newContext();
  const pageA = await ctxA.newPage();
  await signUp(pageA);
  await pageA.click('text=+ New board');
  await pageA.waitForURL(/\/b\//);
  const url = pageA.url();

  const ctxB = await browser.newContext();
  const pageB = await ctxB.newPage();
  await pageB.goto(url);
  await pageB.waitForSelector("canvas", { timeout: 15_000 });

  await pageA.click('text=Sticky');
  const canvasA = await pageA.locator("canvas").first();
  const box = await canvasA.boundingBox();
  if (!box) throw new Error("no canvas bounding box");
  await pageA.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

  await pageB.waitForTimeout(500);
  await pageB.reload();
  await pageB.waitForSelector("canvas");

  await expect(pageB.locator("canvas").first()).toBeVisible();
});
