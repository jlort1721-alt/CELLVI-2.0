import { test, expect, Page } from "@playwright/test";

// Pre-accept cookies via localStorage before each test
async function suppressCookieBanner(page: Page) {
    await page.addInitScript(() => {
        localStorage.setItem(
            "cellvi_cookie_consent",
            JSON.stringify({ necessary: true, analytics: true, marketing: true, timestamp: new Date().toISOString() })
        );
    });
}

test.describe("Responsive — Mobile 390px", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("landing page renders without horizontal scroll", async ({ page }) => {
        await suppressCookieBanner(page);
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await page.evaluate(() => window.innerWidth);
        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5);
    });

    test("dashboard has hamburger menu visible on mobile", async ({ page }) => {
        await suppressCookieBanner(page);
        await page.goto("/demo");
        await page.waitForLoadState("networkidle");

        const hamburger = page.locator("header button").first();
        await expect(hamburger).toBeVisible();
    });

    test("sidebar toggle works on mobile", async ({ page }) => {
        await suppressCookieBanner(page);
        await page.goto("/demo");
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(500);

        // Close sidebar (starts open) — use JS click to bypass backdrop overlay
        await page.evaluate(() => {
            const btn = document.querySelector("header button") as HTMLButtonElement;
            btn?.click();
        });
        await page.waitForTimeout(500);

        const isHidden = await page.evaluate(() => {
            const aside = document.querySelector("aside");
            return (aside?.getAttribute("class") || "").includes("-translate-x-full");
        });
        expect(isHidden).toBe(true);

        // Re-open sidebar — JS click (no backdrop now, but keep consistent)
        await page.evaluate(() => {
            const btn = document.querySelector("header button") as HTMLButtonElement;
            btn?.click();
        });
        await page.waitForTimeout(500);

        const isVisible = await page.evaluate(() => {
            const aside = document.querySelector("aside");
            return (aside?.getAttribute("class") || "").includes("translate-x-0");
        });
        expect(isVisible).toBe(true);
    });

    test("tab click navigates on mobile", async ({ page }) => {
        await suppressCookieBanner(page);
        await page.goto("/demo");
        await page.waitForLoadState("networkidle");

        // Click Fuel/Combustible tab (handle en/es)
        await page.locator("aside button", { hasText: /^Fuel$|^Combustible$/ }).click();
        await page.waitForTimeout(1000);

        const content = await page.locator(".flex-1.overflow-auto").textContent();
        expect(content).toMatch(/L\/100km|Consum|Fuel|Combustible/i);
    });

    test("fuel dashboard uses responsive grid", async ({ page }) => {
        await suppressCookieBanner(page);
        await page.goto("/demo");
        await page.waitForLoadState("networkidle");

        await page.locator("aside button", { hasText: /^Fuel$|^Combustible$/ }).click();
        await page.waitForTimeout(1000);

        // Check that grid-cols-1 sm:grid-cols-3 exists in DOM
        const hasResponsiveGrid = await page.evaluate(() => {
            const allEl = document.querySelectorAll("*");
            for (let i = 0; i < allEl.length; i++) {
                const cls = allEl[i].getAttribute("class") || "";
                if (cls.includes("grid-cols-1") && cls.includes("sm:grid-cols-3")) return true;
            }
            return false;
        });
        expect(hasResponsiveGrid).toBe(true);
    });

    test("privacy page is readable on mobile", async ({ page }) => {
        await suppressCookieBanner(page);
        await page.goto("/privacidad");
        await page.waitForLoadState("networkidle");

        const title = page.getByText("Política de Privacidad");
        await expect(title.first()).toBeVisible();

        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await page.evaluate(() => window.innerWidth);
        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5);
    });

    test("terms page is readable on mobile", async ({ page }) => {
        await suppressCookieBanner(page);
        await page.goto("/terminos");
        await page.waitForLoadState("networkidle");

        const title = page.getByText("Términos y Condiciones");
        await expect(title.first()).toBeVisible();

        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await page.evaluate(() => window.innerWidth);
        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5);
    });
});

test.describe("Responsive — Tablet 768px", () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test("dashboard renders cleanly on tablet", async ({ page }) => {
        await suppressCookieBanner(page);
        await page.goto("/demo");
        await page.waitForLoadState("networkidle");

        const header = page.locator("header");
        await expect(header).toBeVisible();

        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        expect(bodyWidth).toBeLessThanOrEqual(768 + 5);
    });
});
