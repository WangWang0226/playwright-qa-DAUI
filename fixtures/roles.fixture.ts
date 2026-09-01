import { test as base, expect, type BrowserContext, type Page } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';

type RoleFixtures = {
  adminContext: BrowserContext;
  adminPage: Page;
  dashboardPage: DashboardPage;
};

export const test = base.extend<RoleFixtures>({
  adminContext: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: 'auth/admin.storageState.json' });
    await use(context);
    await context.close();
  },
  adminPage: async ({ adminContext }, use) => {
    const page = await adminContext.newPage();
    await use(page);
    await page.close();
  },
  dashboardPage: async ({ adminPage }, use) => {
    await use(new DashboardPage(adminPage));
  }
});

export { expect };
