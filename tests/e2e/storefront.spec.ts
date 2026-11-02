import { expect, test } from "@playwright/test";

// Needs `npm run seed:dev` first. Chrome/Edge resolve *.localhost automatically.
const royal = "http://royalstitches.localhost:3000";
const elegant = "http://elegantstyles.localhost:3000";

test("two shops show different branding and different catalogues", async ({ page }) => {
  await page.goto(`${royal}/products`);
  await expect(page.getByRole("heading", { name: "Senator Suit" })).toBeVisible();
  await expect(page.getByText("Ankara Peplum Dress")).toHaveCount(0);

  await page.goto(`${elegant}/products`);
  await expect(page.getByRole("heading", { name: "Ankara Peplum Dress" })).toBeVisible();
  await expect(page.getByText("Senator Suit")).toHaveCount(0);
});

test("a product from another shop is not found by slug", async ({ page }) => {
  const res = await page.goto(`${elegant}/products/senator-suit`);
  expect(res?.status()).toBe(404);
  const ok = await page.goto(`${royal}/products/senator-suit`);
  expect(ok?.status()).toBe(200);
});

test("shop sitemap lists only that shop's products", async ({ request }) => {
  const xml = await (await request.get(`${royal}/sitemap.xml`)).text();
  expect(xml).toContain("/products/senator-suit");
  expect(xml).not.toContain("ankara-peplum-dress");
});

test("main site does not serve storefront pages", async ({ request }) => {
  expect((await request.get("http://localhost:3000/products")).status()).toBe(404);
});
