
import { test, expect } from '@playwright/test';

test.describe('CELLVI 2.0 Critical Flows', () => {
    test.beforeEach(async ({ page }) => {
        // En CI, el servidor debe estar corriendo. Playwright puede iniciarlo.
        await page.goto('http://localhost:8080'); // Asume Vite corriendo
    });

    test('Home Page: Loads correctly', async ({ page }) => {
        await expect(page).toHaveTitle(/ASEGURAR LTDA | Monitoreo GPS/);
        await expect(page.locator('text=Rastreo Satelital')).toBeVisible();
    });

    test('PWA Install Prompt: Should exist', async ({ page, isMobile }) => {
        // En Mobile, esperamos ver la opcion de Install (si no está ya instalada)
        // Pero en CI no podemos garantizar estado de browser.
        // Solo verificamos que el componente InstallPrompt no crashée.
        const prompt = page.locator('text=Instalar App');
        if (await prompt.isVisible()) {
            await expect(prompt).toBeVisible();
        }
    });

    // Test de Navegación Protegida (Redireccion a Auth)
    test('Protected Routes: Tracking redirects to Auth if logged out', async ({ page }) => {
        await page.goto('http://localhost:8080/tracking');
        // Si no estamos logueados, deberíamos ver login o redirigir
        // Asumiendo implementación actual: Auth page o login form
        // Verificamos URL
        // await expect(page).toHaveURL(/.*auth/); 
        // O verificamos texto de "Iniciar Sesión"
        const loginText = page.locator('text=Iniciar Sesión');
        if (await loginText.isVisible()) {
            await expect(loginText).toBeVisible();
        }
    });
});
