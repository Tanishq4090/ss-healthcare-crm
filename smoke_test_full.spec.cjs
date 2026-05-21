const { test, expect } = require('@playwright/test');

test('SS Health Care core workflow smoke test full', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(3000);

  const hasLogin = await page.getByRole('button').filter({ hasText: /Login|Sign In|Continue/i }).isVisible();
  if (hasLogin) {
    const textInputs = await page.locator('input[type="text"], input[type="email"], input:not([type="hidden"])').all();
    if (textInputs.length > 0) await textInputs[0].fill('admin');

    const passInputs = await page.locator('input[type="password"]').all();
    if (passInputs.length > 0) await passInputs[0].fill('admin');

    await page.getByRole('button').filter({ hasText: /Login|Sign In|Continue/i }).click();
    await page.waitForTimeout(3000);
  }

  // 1. Dashboard
  await expect(page.getByRole('link', { name: 'Dashboard' }).first()).toBeVisible();

  // 2. AI CRM
  await page.getByRole('link', { name: 'AI CRM' }).first().click();
  await page.waitForTimeout(1000);

  // 3. Clients
  await page.getByRole('link', { name: 'Clients' }).first().click();
  await page.waitForTimeout(1000);

  // 4. AI HR
  await page.getByRole('link', { name: 'AI HR' }).first().click();
  await page.waitForTimeout(1000);
  // Just verify AI HR page loaded via heading or main element
  await expect(page.getByRole('heading', { name: /HR/i }).first()).toBeVisible({ timeout: 10000 });

  // 5. Finance
  await page.getByRole('link', { name: 'Finance' }).first().click();
  await page.waitForTimeout(1000);

  // 6. Access Control
  await page.getByRole('link', { name: 'Access Control' }).first().click();
  await page.waitForTimeout(1000);

  // 7. System Status
  await page.getByRole('link', { name: 'System Status' }).first().click();
  await page.waitForTimeout(1000);

  console.log("PASS: Core navigation workflow tested successfully.");
});
