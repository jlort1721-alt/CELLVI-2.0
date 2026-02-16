import { test, expect } from '@playwright/test';

// Configure longer timeout
test.use({ actionTimeout: 10000 });

test.describe('Public Pages', () => {
  test('should load demo page', async ({ page }) => {
    await page.goto('/demo', { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Verify demo page loads
    await expect(page).toHaveURL(/.*demo/, { timeout: 10000 });
  });

  test('should load API documentation', async ({ page }) => {
    await page.goto('/api', { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Verify API page loads
    await expect(page).toHaveURL(/.*api/, { timeout: 10000 });
  });
});
