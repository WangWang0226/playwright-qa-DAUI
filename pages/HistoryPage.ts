import { expect, type Locator, type Page } from '@playwright/test';

export class HistoryPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/transactions/history');
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/\/transactions\/history/);
    await expect(this.page.getByRole('heading', { name: /transaction log|history/i }).first()).toBeVisible();
    await expect(this.page.getByText(/transaction history|status|amount/i).first()).toBeVisible();
  }

  async expectReadOnlyVisible() {
    await this.expectLoaded();
    await expect(this.page.getByRole('button', { name: /approve|reject/i })).toHaveCount(0);
    await expect(this.page.getByRole('button', { name: /confirm transaction initiation/i })).toHaveCount(0);
  }

  async applyBasicFilters() {
    const senderFilter = this.filterInput(/filter sender|sender|from/i).first();
    if (await senderFilter.isVisible().catch(() => false)) {
      await senderFilter.fill('US');
    }

    const receiverFilter = this.filterInput(/filter receiver|receiver|to/i).first();
    if (await receiverFilter.isVisible().catch(() => false)) {
      await receiverFilter.fill('wallet');
    }

    const minFilter = this.page.getByPlaceholder(/^min$/i).first();
    if (await minFilter.isVisible().catch(() => false)) {
      await minFilter.fill('1');
    }
  }

  async expectRowsOrEmptyState() {
    const body = this.page.locator('body');
    await expect(body).toBeVisible();
    const firstRow = this.page.locator('tbody tr').first();
    if (await firstRow.isVisible().catch(() => false)) {
      await expect(firstRow).toBeVisible();
      return;
    }

    await expect(this.page.getByText(/no transactions|no results|empty/i).first()).toBeVisible();
  }

  async expectExportAvailable() {
    await expect(this.page.getByRole('button', { name: /export data|export|download/i })).toBeVisible();
  }

  rowByText(text: string | RegExp): Locator {
    return this.page.getByRole('row').filter({ hasText: text }).first();
  }

  private filterInput(name: RegExp): Locator {
    return this.page
      .getByPlaceholder(name)
      .or(this.page.getByLabel(name))
      .or(this.page.getByRole('textbox', { name }));
  }
}
