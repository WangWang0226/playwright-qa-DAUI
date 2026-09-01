import { expect, type Locator, type Page } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/\/dashboard/);
    await expect(this.page.getByText(/dashboard|operations|portfolio|transaction/i).first()).toBeVisible();
  }

  navLink(name: RegExp): Locator {
    return this.page.getByRole('link', { name }).or(this.page.getByRole('button', { name }));
  }
}
