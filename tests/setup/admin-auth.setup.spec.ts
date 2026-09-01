import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { credentials } from '../../utils/env';

test('authenticate admin and save storage state', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.expectLoaded();
  if (credentials.admin.allowSimulationFallback) {
    await loginPage.loginWithFallback(
      credentials.admin.username,
      credentials.admin.password,
      credentials.admin.fallbackQuickSelect
    );
  } else {
    await loginPage.login(credentials.admin.username, credentials.admin.password);
  }

  await expect(page).toHaveURL(/\/dashboard|\/$/);
  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const raw = localStorage.getItem('scotia_accounts');
          if (!raw) return 0;
          try {
            const accounts = JSON.parse(raw);
            return Array.isArray(accounts) ? accounts.length : 0;
          } catch {
            return 0;
          }
        }),
      {
        timeout: 30000,
        intervals: [1000, 2000, 5000],
        message: 'Wait for accounts to load before saving admin storage state'
      }
    )
    .toBeGreaterThan(0);

  await page.context().storageState({ path: 'auth/admin.storageState.json' });
});
