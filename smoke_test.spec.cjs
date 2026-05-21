const { test, expect } = require('@playwright/test');

test('SS Health Care core workflow smoke test', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Wait a bit to see what's rendering
  await page.waitForTimeout(3000);

  const html = await page.content();
  console.log("Current page HTML snippet:", html.substring(0, 1000));
  console.log("Check if login form exists...");

  // In this app, the login form uses the text "SS Health Care" and inputs.
  // The login form is typically not "Sign In", it might be "Login" or "Continue"
  const hasLogin = await page.getByRole('button').filter({ hasText: /Login|Sign In|Continue/i }).isVisible();

  if (hasLogin) {
    console.log("Logging in using fallback admin credentials...");
    // Just try to fill any text/password inputs on the page
    const textInputs = await page.locator('input[type="text"], input[type="email"], input:not([type="hidden"])').all();
    if (textInputs.length > 0) await textInputs[0].fill('admin');

    const passInputs = await page.locator('input[type="password"]').all();
    if (passInputs.length > 0) await passInputs[0].fill('admin');

    await page.getByRole('button').filter({ hasText: /Login|Sign In|Continue/i }).click();
    await page.waitForTimeout(3000);
  } else {
    console.log("No explicit login button found, or maybe already logged in.");
  }

  // Look for any links or buttons that might represent the sidebar
  const buttons = await page.locator('button, a').allInnerTexts();
  console.log("Available clickable text elements:", buttons);

});
