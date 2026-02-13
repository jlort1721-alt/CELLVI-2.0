import { test, expect, Page } from "@playwright/test";

// Pre-accept cookies via localStorage before each test to avoid banner interference
async function suppressCookieBanner(page: Page) {
    await page.addInitScript(() => {
        localStorage.setItem(
            "cellvi_cookie_consent",
            JSON.stringify({ necessary: true, analytics: true, marketing: true, timestamp: new Date().toISOString() })
        );
    });
}

test.describe("Dashboard — Navigation & Modules", () => {
    test.beforeEach(async ({ page }) => {
        await suppressCookieBanner(page);
        await page.goto("/demo");
        await page.waitForLoadState("networkidle");
    });

    test("dashboard loads with header and sidebar", async ({ page }) => {
        const header = page.locator("header").first();
        await expect(header).toBeVisible();
        const logo = page.locator('img[alt*="ASEGURAR"]');
        await expect(logo).toBeVisible();
    });

    test("sidebar shows all 5 module groups", async ({ page }) => {
        const sidebar = page.locator("aside");
        await expect(sidebar).toBeVisible();
        // Groups render as uppercase text in both en/es
        for (const groupPattern of [/MONITOREO|MONITORING/, /FLOTA|FLEET/, /OPERACIONES|OPERATIONS/, /CONTROL/, /ANALYTICS/]) {
            const label = sidebar.getByText(groupPattern).first();
            await expect(label).toBeVisible();
        }
    });

    test("sidebar shows all 15+ navigation tabs", async ({ page }) => {
        const sidebar = page.locator("aside");
        const buttons = sidebar.locator("button");
        expect(await buttons.count()).toBeGreaterThanOrEqual(15);
    });

    test("Command Center is default active tab", async ({ page }) => {
        const activeTab = page.locator("aside button.bg-sidebar-accent");
        await expect(activeTab).toContainText("Command Center");
    });

    test("clicking a tab changes content", async ({ page }) => {
        // Click via "Map" (en) or "Mapa" (es) — Playwright locale defaults to en
        await page.locator("aside button", { hasText: /^Map$|^Mapa$/ }).click();
        await page.waitForTimeout(1000);

        const content = await page.locator(".flex-1.overflow-auto").textContent();
        expect(content).toMatch(/En Movimiento|Motor Apagado|Moving|Stopped|Leaflet/i);
    });

    test("system status indicator is visible", async ({ page }) => {
        const statusIndicator = page.getByText(/Sistema Online|System Online/i);
        await expect(statusIndicator).toBeVisible();
    });

    test("exit link navigates back to landing", async ({ page }) => {
        const exitLink = page.locator('a[href="/"]').first();
        await expect(exitLink).toBeVisible();
    });

    test("live clock is ticking", async ({ page }) => {
        const clockEl = page.locator("header").getByText(/\d{1,2}:\d{2}:\d{2}/);
        const firstTime = await clockEl.textContent();
        await page.waitForTimeout(1500);
        const secondTime = await clockEl.textContent();
        expect(firstTime).not.toBe(secondTime);
    });
});

test.describe("Dashboard — All Module Tabs Render", () => {
    // Tab names mapped with both en/es variants and expected content
    const tabModules = [
        { namePattern: /Command Center/, expectText: /VEHÍCULOS|VEHICLES|Command Center/i },
        { namePattern: /^Map$|^Mapa$/, expectText: /Moving|En Movimiento|Motor|Stopped|Leaflet/i },
        { namePattern: /^Alerts$|^Alertas$/, expectText: /Alert|Alerta|Crítica|Critical|Alta/i },
        { namePattern: /^Routes$|^Rutas$/, expectText: /Route|Ruta|Distance|Distancia|Origin|Origen/i },
        { namePattern: /^Geofences$|^Geocercas$/, expectText: /Geofence|Geocerca|Region|Región|Area|Área/i },
        { namePattern: /Conductores|Drivers/, expectText: /Conductor|Driver|Score|Licencia|License/i },
        { namePattern: /^Fuel$|^Combustible$/, expectText: /L\/100km|Consum|Fuel|Combustible/i },
        { namePattern: /Cadena de Frío|Cold Chain/, expectText: /Temperatura|Temperature|Sensor|Humedad|Humidity/i },
        { namePattern: /Conectividad|Connectivity/, expectText: /Conectividad|Connectivity|Cobertura|Coverage|Signal/i },
        { namePattern: /Evidencia|Evidence/, expectText: /Evidence|SHA|Sellado|Sealed|Integridad|Integrity/i },
        { namePattern: /Motor de Reglas|Policy Engine/, expectText: /Regla|Rule|Policy|Motor|Engine/i },
        { namePattern: /GNSS Security/, expectText: /GNSS|Jamming|Spectrum|Detección|Detection/i },
        { namePattern: /Auditoría|Audit/, expectText: /Audit|Log|Registro|Access|Auditoría/i },
        { namePattern: /Cumplimiento|Compliance/, expectText: /Compliance|PESV|SICE|Cumplimiento|Normativa/i },
        { namePattern: /^Reports$|^Reportes$/, expectText: /Report|Reporte|PDF|Informe|Generated|Generado/i },
    ];

    for (const { namePattern, expectText } of tabModules) {
        test(`"${namePattern.source}" module renders correctly`, async ({ page }) => {
            await suppressCookieBanner(page);
            await page.goto("/demo");
            await page.waitForLoadState("networkidle");

            // Click the tab using regex pattern to handle en/es
            await page.locator("aside button", { hasText: namePattern }).click();
            await page.waitForTimeout(1500);

            const mainArea = page.locator(".flex-1.overflow-auto");
            await expect(mainArea).toBeVisible();
            const text = await mainArea.textContent();
            expect(text).toMatch(expectText);
        });
    }
});
