import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test('TC-UI-OPS-AUTH-001 unauthenticated user is redirected to login for protected route', async ({ page }) => {
  await page.goto('/dashboard');

  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole('button', { name: /sign in|login/i })).toBeVisible();
});
