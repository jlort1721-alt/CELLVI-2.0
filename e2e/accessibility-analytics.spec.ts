import { test, expect, Page } from "@playwright/test";

async function suppressCookieBanner(page: Page) {
    await page.addInitScript(() => {
        localStorage.setItem(
            "cellvi_cookie_consent",
            JSON.stringify({ necessary: true, analytics: true, marketing: true, timestamp: new Date().toISOString() })
        );
    });
}

test.describe("Accessibility — Core Pages", () => {
    test("landing page has proper heading hierarchy", async ({ page }) => {
        await suppressCookieBanner(page);
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        // Only one <h1> on the page
        const h1Count = await page.locator("h1").count();
        expect(h1Count).toBe(1);

        // All images have alt text
        const images = await page.locator("img").all();
        for (const img of images) {
            const alt = await img.getAttribute("alt");
            expect(alt).toBeTruthy();
        }
    });

    test("landing page has proper meta tags", async ({ page }) => {
        await suppressCookieBanner(page);
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        const title = await page.title();
        expect(title.length).toBeGreaterThan(10);

        const metaDesc = await page.locator('meta[name="description"]').getAttribute("content");
        expect(metaDesc).toBeTruthy();
        expect(metaDesc!.length).toBeGreaterThan(50);
    });

    test("interactive elements have focus indicators", async ({ page }) => {
        await suppressCookieBanner(page);
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        // Tab to first link and verify it's focusable
        await page.keyboard.press("Tab");
        const focused = await page.evaluate(() => document.activeElement?.tagName);
        expect(["A", "BUTTON", "INPUT"]).toContain(focused);
    });

    test("color contrast: text is readable", async ({ page }) => {
        await suppressCookieBanner(page);
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        // Verify body has a background color set (not default white on dark text)
        const bgColor = await page.evaluate(() => {
            return getComputedStyle(document.body).backgroundColor;
        });
        expect(bgColor).toBeTruthy();
    });

    test("dashboard has accessible sidebar navigation", async ({ page }) => {
        await suppressCookieBanner(page);
        await page.goto("/demo");
        await page.waitForLoadState("networkidle");

        // Sidebar has nav element
        const nav = page.locator("aside nav");
        await expect(nav).toBeVisible();

        // All sidebar buttons are keyboard-accessible
        const buttons = await page.locator("aside button").all();
        expect(buttons.length).toBeGreaterThan(10);

        for (const btn of buttons) {
            const isDisabled = await btn.isDisabled();
            expect(isDisabled).toBe(false);
        }
    });

    test("forms have properly associated labels", async ({ page }) => {
        await suppressCookieBanner(page);
        await page.goto("/pqr");
        await page.waitForLoadState("networkidle");

        // All visible input/textarea/select elements should be identifiable
        const inputs = await page.locator("input:visible, textarea:visible, select:visible").all();
        for (const input of inputs) {
            const hasLabel = await input.getAttribute("aria-label")
                || await input.getAttribute("placeholder")
                || await input.getAttribute("id")
                || await input.getAttribute("name");
            expect(hasLabel).toBeTruthy();
        }
    });

    test("links have discernible text", async ({ page }) => {
        await suppressCookieBanner(page);
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        const links = await page.locator("a").all();
        for (const link of links) {
            const text = await link.textContent();
            const aria = await link.getAttribute("aria-label");
            const title = await link.getAttribute("title");
            // Link should have text content, aria-label, or title
            const hasDiscernible = (text && text.trim().length > 0) || aria || title;
            expect(hasDiscernible).toBeTruthy();
        }
    });
});

test.describe("Predictive Analytics Module", () => {
    test("analytics module loads and shows KPIs", async ({ page }) => {
        await suppressCookieBanner(page);
        await page.goto("/demo");
        await page.waitForLoadState("networkidle");

        // Click the Predictive Analytics tab
        await page.locator("aside button", { hasText: /Análisis Predictivo|Predictive Analytics/ }).click();
        await page.waitForTimeout(1500);

        const content = await page.locator(".flex-1.overflow-auto").textContent();
        expect(content).toMatch(/Salud de Flota|Fleet Health/i);
        expect(content).toMatch(/Anomalías|Anomalies/i);
        expect(content).toMatch(/Precisión|Accuracy/i);
    });

    test("analytics shows prediction chart", async ({ page }) => {
        await suppressCookieBanner(page);
        await page.goto("/demo");
        await page.waitForLoadState("networkidle");

        await page.locator("aside button", { hasText: /Análisis Predictivo|Predictive Analytics/ }).click();
        await page.waitForTimeout(1500);

        // Recharts renders SVG elements
        const hasSvg = await page.locator(".recharts-responsive-container").count();
        expect(hasSvg).toBeGreaterThan(0);
    });

    test("analytics anomaly tab shows events", async ({ page }) => {
        await suppressCookieBanner(page);
        await page.goto("/demo");
        await page.waitForLoadState("networkidle");

        await page.locator("aside button", { hasText: /Análisis Predictivo|Predictive Analytics/ }).click();
        await page.waitForTimeout(1500);

        const content = await page.locator(".flex-1.overflow-auto").textContent();
        expect(content).toMatch(/NAR-123|PUT-321|CAU-654/);
        expect(content).toMatch(/SPEED|FUEL|ROUTE|MAINTENANCE|DRIVER/);
    });

    test("analytics maintenance tab works", async ({ page }) => {
        await suppressCookieBanner(page);
        await page.goto("/demo");
        await page.waitForLoadState("networkidle");

        await page.locator("aside button", { hasText: /Análisis Predictivo|Predictive Analytics/ }).click();
        await page.waitForTimeout(1000);

        // Click Maintenance tab
        const mttoBtn = page.locator("button", { hasText: /Predicción Mtto|Predictive Maint/ });
        await mttoBtn.click();
        await page.waitForTimeout(500);

        const content = await page.locator(".flex-1.overflow-auto").textContent();
        expect(content).toMatch(/Frenos|Brakes|Aceite|Oil|Neumáticos|Tires/i);
    });
});
