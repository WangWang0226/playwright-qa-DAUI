import { expect, type Page } from '@playwright/test';

export class ApprovalQueuePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/queue');
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/\/queue/);
    await expect(this.page.getByText(/approval|queue|pending|review/i).first()).toBeVisible();
  }
}
