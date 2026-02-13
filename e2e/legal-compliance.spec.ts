import { test, expect } from "@playwright/test";

test.describe("Legal Compliance — Cookie Banner", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/");
        await page.evaluate(() => localStorage.removeItem("cellvi_cookie_consent"));
        await page.reload();
        await page.waitForTimeout(2500);
    });

    test("cookie banner appears after delay on fresh visit", async ({ page }) => {
        const banner = page.getByText("Política de Cookies");
        await expect(banner).toBeVisible();
    });

    test("cookie banner has required legal reference", async ({ page }) => {
        // Check that Ley 1581 text appears somewhere in the page
        const content = await page.textContent("body");
        expect(content).toContain("Ley 1581 de 2012");
    });

    test("cookie banner has 3 action buttons", async ({ page }) => {
        const acceptAll = page.getByRole("button", { name: /Aceptar todas/i });
        const rejectOptional = page.getByRole("button", { name: /Solo necesarias/i });
        const configure = page.getByRole("button", { name: /Configurar/i });

        await expect(acceptAll).toBeVisible();
        await expect(rejectOptional).toBeVisible();
        await expect(configure).toBeVisible();
    });

    test("clicking Configurar expands cookie settings", async ({ page }) => {
        await page.getByRole("button", { name: /Configurar/i }).click();
        await page.waitForTimeout(800);

        // Check for cookie category labels (use exact to avoid "Solo necesarias" match)
        const necessary = page.getByText("Necesarias", { exact: true });
        const analytics = page.getByText("Analíticas", { exact: true });

        await expect(necessary).toBeVisible();
        await expect(analytics).toBeVisible();
    });

    test("accepting all cookies hides banner and persists", async ({ page }) => {
        await page.getByRole("button", { name: /Aceptar todas/i }).click();
        await page.waitForTimeout(800);

        const banner = page.getByText("Política de Cookies");
        await expect(banner).not.toBeVisible();

        const consent = await page.evaluate(() => localStorage.getItem("cellvi_cookie_consent"));
        expect(consent).toBeTruthy();
        const parsed = JSON.parse(consent!);
        expect(parsed.analytics).toBe(true);
        expect(parsed.marketing).toBe(true);
        expect(parsed.necessary).toBe(true);
    });

    test("rejecting optional cookies persists minimal consent", async ({ page }) => {
        await page.getByRole("button", { name: /Solo necesarias/i }).click();
        await page.waitForTimeout(800);

        const consent = await page.evaluate(() => localStorage.getItem("cellvi_cookie_consent"));
        expect(consent).toBeTruthy();
        const parsed = JSON.parse(consent!);
        expect(parsed.necessary).toBe(true);
        expect(parsed.analytics).toBe(false);
        expect(parsed.marketing).toBe(false);
    });

    test("cookie banner does NOT reappear after consent given", async ({ page }) => {
        await page.getByRole("button", { name: /Aceptar todas/i }).click();
        await page.waitForTimeout(500);

        await page.reload();
        await page.waitForTimeout(2500);

        const banner = page.getByText("Política de Cookies");
        await expect(banner).not.toBeVisible();
    });
});

test.describe("Legal Compliance — Privacy Policy Page", () => {
    test("privacy page loads at /privacidad", async ({ page }) => {
        const response = await page.goto("/privacidad");
        expect(response?.status()).toBe(200);
    });

    test("has correct title", async ({ page }) => {
        await page.goto("/privacidad");
        const title = page.getByText("Política de Privacidad");
        await expect(title.first()).toBeVisible();
    });

    test("references Ley 1581 de 2012", async ({ page }) => {
        await page.goto("/privacidad");
        const lawRef = page.getByText("Ley 1581 de 2012");
        await expect(lawRef.first()).toBeVisible();
    });

    test("has all 9 required legal sections", async ({ page }) => {
        await page.goto("/privacidad");

        const requiredSections = [
            "Responsable del Tratamiento",
            "Datos Recopilados",
            "Finalidad del Tratamiento",
            "Seguridad de los Datos",
            "Derechos del Titular",
            "Transferencia Internacional",
            "Cookies y Tecnologías",
            "Retención de Datos",
            "Contacto y Autoridad",
        ];

        for (const section of requiredSections) {
            const el = page.getByText(section, { exact: false });
            await expect(el.first()).toBeVisible();
        }
    });

    test("has link to terms page", async ({ page }) => {
        await page.goto("/privacidad");
        const termsLink = page.getByRole("link", { name: /Términos/i });
        await expect(termsLink.first()).toBeVisible();
    });

    test("has back to home link", async ({ page }) => {
        await page.goto("/privacidad");
        const homeLink = page.getByText("Volver al inicio").first();
        await expect(homeLink).toBeVisible();
    });

    test("mentions corporate email", async ({ page }) => {
        await page.goto("/privacidad");
        const email = page.getByText("asegurar.limitada@asegurar.com.co");
        await expect(email.first()).toBeVisible();
    });

    test("mentions SIC as supervisory authority", async ({ page }) => {
        await page.goto("/privacidad");
        const sic = page.getByText(/Superintendencia de Industria y Comercio/i);
        await expect(sic.first()).toBeVisible();
    });
});

test.describe("Legal Compliance — Terms Page", () => {
    test("terms page loads at /terminos", async ({ page }) => {
        const response = await page.goto("/terminos");
        expect(response?.status()).toBe(200);
    });

    test("has correct title", async ({ page }) => {
        await page.goto("/terminos");
        const title = page.getByText("Términos y Condiciones");
        await expect(title.first()).toBeVisible();
    });

    test("has all 9 required legal sections", async ({ page }) => {
        await page.goto("/terminos");

        const requiredSections = [
            "Objeto y Aceptación",
            "Registro y Cuentas",
            "Uso Aceptable",
            "Planes, Precios y Facturación",
            "Propiedad Intelectual",
            "Limitación de Responsabilidad",
            "Suspensión y Terminación",
            "Niveles de Servicio",
            "Legislación Aplicable",
        ];

        for (const section of requiredSections) {
            const el = page.getByText(section, { exact: false });
            await expect(el.first()).toBeVisible();
        }
    });

    test("has link to privacy page", async ({ page }) => {
        await page.goto("/terminos");
        const privacyLink = page.getByRole("link", { name: /Privacidad/i });
        await expect(privacyLink.first()).toBeVisible();
    });

    test("mentions NIT", async ({ page }) => {
        await page.goto("/terminos");
        const nit = page.getByText("814.006.622-1");
        await expect(nit.first()).toBeVisible();
    });

    test("mentions SLA percentages", async ({ page }) => {
        await page.goto("/terminos");
        const sla = page.getByText("99.9%");
        await expect(sla.first()).toBeVisible();
    });
});
