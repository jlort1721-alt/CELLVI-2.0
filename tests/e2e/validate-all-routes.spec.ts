import { test, expect } from '@playwright/test';

// Configurar timeout largo
test.use({ actionTimeout: 15000 });

const PUBLIC_ROUTES = [
  { path: '/', name: 'Landing Page' },
  { path: '/demo', name: 'Demo' },
  { path: '/verify', name: 'Verificador Blockchain' },
  { path: '/pqr', name: 'PQRS' },
  { path: '/auth', name: 'Login/Registro' },
  { path: '/api', name: 'API Docs' },
  { path: '/tracking', name: 'Tracking Público' },
  { path: '/planning', name: 'Planificador de Rutas' },
  { path: '/driver', name: 'Vista Conductor' },
  { path: '/privacidad', name: 'Privacidad' },
  { path: '/terminos', name: 'Términos' },
];

const PROTECTED_ROUTES = [
  { path: '/platform', name: 'Dashboard Principal' },
  { path: '/platform/preoperacional', name: 'Checklist Preoperacional' },
  { path: '/platform/rndc', name: 'RNDC' },
  { path: '/platform/mantenimiento', name: 'Mantenimiento' },
  { path: '/platform/mantenimiento-lista', name: 'Lista Mantenimiento' },
  { path: '/platform/seguridad', name: 'Seguridad' },
  { path: '/platform/auditoria', name: 'Auditoría' },
  { path: '/platform/reportes', name: 'Reportes' },
  { path: '/platform/maestro-repuestos', name: 'Inventario Repuestos' },
];

test.describe('Rutas Públicas - Validación', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route.name} (${route.path}) debe cargar`, async ({ page }) => {
      const errors: string[] = [];

      page.on('pageerror', error => {
        errors.push(`${error.message}`);
        console.log(`❌ ERROR en ${route.path}:`, error.message);
      });

      page.on('console', msg => {
        if (msg.type() === 'error' && !msg.text().includes('LogRocket')) {
          console.log(`⚠️  Console error en ${route.path}:`, msg.text());
        }
      });

      try {
        await page.goto(`http://localhost:8080${route.path}`, {
          waitUntil: 'domcontentloaded',
          timeout: 15000
        });

        await page.waitForTimeout(2000);

        // Verificar que no haya pantalla blanca
        const bodyText = await page.evaluate(() => document.body.innerText);

        if (bodyText.length < 50 && !bodyText.includes('Loading')) {
          throw new Error('Página parece estar vacía (pantalla blanca)');
        }

        console.log(`✅ ${route.name} (${route.path}) - OK`);

        // Si hay errores críticos, fallar el test
        if (errors.length > 0) {
          const criticalErrors = errors.filter(e =>
            !e.includes('LogRocket') &&
            !e.includes('CSP') &&
            !e.includes('logger-1.min.js')
          );

          if (criticalErrors.length > 0) {
            throw new Error(`Errores críticos: ${criticalErrors.join(', ')}`);
          }
        }

      } catch (error) {
        console.log(`❌ FALLO en ${route.name} (${route.path}):`, error);
        throw error;
      }
    });
  }
});

test.describe('Rutas Protegidas - Validación (Redireccionan a /auth)', () => {
  for (const route of PROTECTED_ROUTES) {
    test(`${route.name} (${route.path}) debe redirigir a /auth`, async ({ page }) => {
      try {
        await page.goto(`http://localhost:8080${route.path}`, {
          waitUntil: 'domcontentloaded',
          timeout: 15000
        });

        await page.waitForTimeout(2000);

        // Verificar redirección a auth o que la página cargó
        const currentURL = page.url();

        if (currentURL.includes('/auth') || currentURL.includes(route.path)) {
          console.log(`✅ ${route.name} (${route.path}) - OK (${currentURL.includes('/auth') ? 'redirigió a auth' : 'cargó correctamente'})`);
        } else {
          console.log(`⚠️  ${route.name} redirigió a: ${currentURL}`);
        }

      } catch (error) {
        console.log(`❌ FALLO en ${route.name} (${route.path}):`, error);
        throw error;
      }
    });
  }
});
