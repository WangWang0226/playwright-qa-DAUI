import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

test('login page loads from live environment', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();

  await expect(page).toHaveTitle(/DASH Ops UI|Scotia|DAM|Operations/i);
  await loginPage.expectLoaded();
});
