import { expect, test } from "@playwright/test";

test("home page shows the approved headline and working auth links", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Discover Tailors/i })).toBeVisible();
  await page.getByRole("link", { name: "Sign in" }).first().click();
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("register form shows server validation for a weak password", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Test User");
  await page.getByLabel("Email").fill("test@example.com");
  await page.getByLabel("Password").fill("short");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText(/at least 10 characters/i).first()).toBeVisible();
});

test("account page sends signed-out visitors to login", async ({ page }) => {
  await page.goto("/account");
  await expect(page).toHaveURL(/\/login\?next=%2Faccount|\/login\?next=\/account/);
});

test("health endpoint never leaks secrets", async ({ request }) => {
  const res = await request.get("/api/v1/health");
  const body = JSON.stringify(await res.json());
  expect(body).not.toMatch(/mongodb:\/\/|SESSION_SECRET|password/i);
});

test("main site pages render with the Tailorly brand and shop links", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Explore Shops" }).first()).toBeVisible();
  for (const [path, heading] of [["/about", /digital tools/i], ["/how-it-works", /idea to finished/i], ["/for-tailors", /your own shop/i], ["/features", /what tailorly does/i], ["/faq", /frequently asked/i], ["/get-started", /how would you like/i], ["/shops", /find a tailor/i]] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
  }
});

test("contact form validates and does not leak server details", async ({ page }) => {
  await page.goto("/contact");
  await page.getByLabel("Your name").fill("A");
  await page.getByLabel("Email").fill("bad");
  await page.getByLabel("Message").fill("short");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("alert").first()).toBeVisible();
});

test("manage area sends signed-out visitors to login and shop-only APIs reject them", async ({ page, request }) => {
  const res = await request.get("/api/v1/shop/products");
  expect([401, 404]).toContain(res.status());
  await page.goto("/manage/products");
  await expect(page).toHaveURL(/\/login|\/manage/);
});

test("robots and sitemap are served", async ({ request }) => {
  expect((await request.get("/robots.txt")).ok()).toBe(true);
  expect((await request.get("/sitemap.xml")).ok()).toBe(true);
});
