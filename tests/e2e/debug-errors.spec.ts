import { test } from '@playwright/test';

test('capture all errors and logs', async ({ page }) => {
  const errors: string[] = [];
  const logs: string[] = [];

  page.on('console', msg => {
    const text = msg.text();
    logs.push(`[${msg.type()}] ${text}`);
    if (msg.type() === 'error') {
      errors.push(text);
      console.log('CONSOLE ERROR:', text);
    }
  });

  page.on('pageerror', error => {
    const errorMsg = `${error.message}\n${error.stack || ''}`;
    errors.push(errorMsg);
    console.log('===================');
    console.log('PAGE ERROR FOUND:');
    console.log(error.message);
    console.log('STACK:', error.stack);
    console.log('===================');
  });

  page.on('requestfailed', request => {
    console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText);
  });

  console.log('Navigating to http://localhost:8080...');

  try {
    await page.goto('http://localhost:8080', {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    await page.waitForTimeout(5000);

    const bodyText = await page.evaluate(() => {
      return {
        text: document.body.innerText,
        html: document.body.innerHTML.substring(0, 500)
      };
    });

    console.log('\n=== PAGE BODY TEXT ===');
    console.log(bodyText.text.substring(0, 500));

    console.log('\n=== ALL CONSOLE LOGS ===');
    logs.forEach(log => console.log(log));

    console.log('\n=== TOTAL ERRORS FOUND:', errors.length);
    if (errors.length > 0) {
      console.log('\n=== ERRORS ===');
      errors.forEach((err, i) => {
        console.log(`\nError ${i + 1}:`);
        console.log(err);
      });
    }

    await page.screenshot({ path: 'screenshot-debug.png', fullPage: true });
    console.log('\nScreenshot saved to screenshot-debug.png');

  } catch (error) {
    console.log('NAVIGATION ERROR:', error);
  }
});
