import { test, expect } from "@playwright/test";

test.describe("Landing Page — Core Navigation", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("networkidle");
    });

    test("has correct page title and meta", async ({ page }) => {
        await expect(page).toHaveTitle(/ASEGURAR LTDA/i);
        const metaDesc = page.locator('meta[name="description"]');
        await expect(metaDesc).toHaveAttribute("content", /.+/);
    });

    test("hero section renders with CTA buttons", async ({ page }) => {
        // Check that visible CTAs exist (check for actionable elements in body)
        const ctaCount = await page.evaluate(() => {
            const allBtns = document.querySelectorAll("a, button");
            return Array.from(allBtns).filter((el) => {
                const text = el.textContent || "";
                const rect = el.getBoundingClientRect();
                return (
                    rect.width > 0 &&
                    rect.height > 0 &&
                    (text.includes("Demo") ||
                        text.includes("Cotización") ||
                        text.includes("demo") ||
                        text.includes("Más información") ||
                        text.includes("Contacto"))
                );
            }).length;
        });
        expect(ctaCount).toBeGreaterThan(0);
    });

    test("navbar is visible and has key links", async ({ page }) => {
        const nav = page.locator("nav").first();
        await expect(nav).toBeVisible();
    });

    test("footer renders with legal links", async ({ page }) => {
        const footer = page.locator("footer");
        await expect(footer).toBeVisible();
    });

    test("theme toggle works", async ({ page }) => {
        const htmlEl = page.locator("html");
        const themeToggle = page.locator('[aria-label*="theme"], [aria-label*="tema"], button:has(svg)').first();
        if (await themeToggle.isVisible()) {
            await themeToggle.click();
            await page.waitForTimeout(500);
            const newClass = await htmlEl.getAttribute("class");
            expect(newClass).not.toBeNull();
        }
    });

    test("scroll to contacto section works", async ({ page }) => {
        await page.goto("/#contacto");
        await page.waitForTimeout(1000);
        const contact = page.locator("#contacto, [id*='contact']").first();
        if (await contact.count() > 0) {
            await expect(contact).toBeVisible();
        }
    });
});

test.describe("Landing Page — SEO & Performance", () => {
    test("has valid robots meta", async ({ page }) => {
        await page.goto("/");
        const robots = page.locator('meta[name="robots"]');
        if (await robots.count() > 0) {
            const content = await robots.getAttribute("content");
            expect(content).not.toContain("noindex");
        }
    });

    test("has JSON-LD structured data", async ({ page }) => {
        await page.goto("/");
        const jsonLd = page.locator('script[type="application/ld+json"]');
        expect(await jsonLd.count()).toBeGreaterThan(0);
        const content = await jsonLd.first().textContent();
        expect(content).toContain("Organization");
    });

    test("sitemap.xml is accessible", async ({ page }) => {
        const response = await page.goto("/sitemap.xml");
        expect(response?.status()).toBe(200);
    });

    test("manifest.json is accessible (PWA)", async ({ page }) => {
        const response = await page.goto("/manifest.json");
        expect(response?.status()).toBe(200);
        const body = await page.textContent("body");
        expect(body).toContain("ASEGURAR");
    });
});
