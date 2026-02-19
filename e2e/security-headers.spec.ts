import { test, expect } from "@playwright/test";

test.describe("Security Headers", () => {
    test("CSP header is present", async ({ page }) => {
        const response = await page.goto("/");
        const headers = response?.headers() || {};
        const csp = headers["content-security-policy"];
        expect(csp).toBeTruthy();
        expect(csp).toContain("default-src");
        expect(csp).toContain("script-src");
        expect(csp).toContain("style-src");
        expect(csp).toContain("frame-ancestors");
    });

    test("X-Content-Type-Options header is nosniff", async ({ page }) => {
        const response = await page.goto("/");
        const headers = response?.headers() || {};
        expect(headers["x-content-type-options"]).toBe("nosniff");
    });

    test("X-Frame-Options header is SAMEORIGIN", async ({ page }) => {
        const response = await page.goto("/");
        const headers = response?.headers() || {};
        expect(headers["x-frame-options"]).toBe("SAMEORIGIN");
    });

    test("X-XSS-Protection header is enabled", async ({ page }) => {
        const response = await page.goto("/");
        const headers = response?.headers() || {};
        expect(headers["x-xss-protection"]).toContain("1");
    });

    test("Referrer-Policy header is set", async ({ page }) => {
        const response = await page.goto("/");
        const headers = response?.headers() || {};
        expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    });

    test("Permissions-Policy header restricts camera/microphone", async ({ page }) => {
        const response = await page.goto("/");
        const headers = response?.headers() || {};
        const pp = headers["permissions-policy"];
        expect(pp).toBeTruthy();
        expect(pp).toContain("camera=(self)");
        expect(pp).toContain("microphone=()");
    });
});

test.describe("Security — Console Errors", () => {
    test("landing page has no critical console errors", async ({ page }) => {
        const errors: string[] = [];
        page.on("console", (msg) => {
            if (msg.type() === "error") {
                errors.push(msg.text());
            }
        });

        await page.goto("/");
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000);

        // Filter out known non-critical errors (React StrictMode, favicon, etc.)
        const criticalErrors = errors.filter(
            (e) =>
                !e.includes("favicon") &&
                !e.includes("React Router") &&
                !e.includes("apple-mobile-web-app-status-bar-style") &&
                !e.includes("net::ERR") && // network errors from external resources
                !e.includes("Failed to load resource") && // non-critical asset loads
                !e.includes("supabase") && // Supabase connection in demo mode
                !e.includes("AuthApiError") && // Auth errors in demo/offline mode
                !e.includes("ERR_BLOCKED_BY_CSP") && // CSP blocks on dev server
                !e.includes("Content Security Policy") && // CSP violation logs (Chromium)
                !e.includes("Content-Security-Policy") // CSP violation logs (Firefox)
        );
        expect(criticalErrors.length).toBe(0);
    });

    test("dashboard has no critical console errors", async ({ page }) => {
        const errors: string[] = [];
        page.on("console", (msg) => {
            if (msg.type() === "error") {
                errors.push(msg.text());
            }
        });

        await page.goto("/demo");
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000);

        const criticalErrors = errors.filter(
            (e) =>
                !e.includes("favicon") &&
                !e.includes("React Router") &&
                !e.includes("apple-mobile-web-app-status-bar-style") &&
                !e.includes("net::ERR") &&
                !e.includes("Failed to load resource") &&
                !e.includes("supabase") &&
                !e.includes("AuthApiError") &&
                !e.includes("ERR_BLOCKED_BY_CSP") &&
                !e.includes("Content Security Policy") &&
                !e.includes("Content-Security-Policy")
        );
        expect(criticalErrors.length).toBe(0);
    });
});
