import { test, expect } from '../../fixtures/roles.fixture';

test('TC-UI-OPS-AUTH-001 authenticated admin can open dashboard', async ({ dashboardPage }) => {
  await dashboardPage.goto();
  await dashboardPage.expectLoaded();
});

test('TC-UI-OPS-AUTH-001 authenticated admin can open primary routes', async ({ adminPage }) => {
  const routes = ['/transactions/new', '/transactions/history', '/queue', '/liquidity'];

  for (const route of routes) {
    await adminPage.goto(route);
    await expect(adminPage).not.toHaveURL(/\/login/);
    await expect(adminPage.locator('body')).toBeVisible();
  }
});
