const { test, expect } = require('@playwright/test');

test('SS Health Care core workflow smoke test', async ({ page }) => {
  // Go to local server
  await page.goto('http://localhost:5173');

  // Verify Login Loads
  await expect(page).toHaveTitle(/SS Health Care/i);
  const loginHeader = await page.getByText(/SS Health Care Admin OS/i).isVisible();
  expect(loginHeader).toBeTruthy();

  // Assuming there's a login form (we can bypass by directly checking the fallback login if implemented,
  // but let's just attempt to log in using the fallback admin).
  const usernameInput = await page.locator('input[type="text"]').first();
  const passwordInput = await page.locator('input[type="password"]').first();

  if (await usernameInput.isVisible()) {
    await usernameInput.fill('admin');
    await passwordInput.fill('admin');
    await page.getByRole('button', { name: /Sign In/i }).click();
  }

  // Verify Dashboard loads
  await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });

  // Verify AI CRM loads
  await page.click('text=AI CRM');
  await expect(page.locator('text=Pipeline')).toBeVisible();

  // Verify AI HR loads
  await page.click('text=AI HR');
  await expect(page.locator('text=Staff Directory')).toBeVisible();

  // Check System Status
  await page.click('text=System Status');
  await expect(page.locator('text=All systems operational')).toBeVisible();
});
