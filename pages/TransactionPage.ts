import { expect, type Locator, type Page } from '@playwright/test';

export class TransactionPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async gotoNewTransaction() {
    await this.page.goto('/transactions/new');
  }

  async expectNewTransactionLoaded() {
    await expect(this.page).toHaveURL(/\/transactions\/new/);
    await expect(this.page.getByText(/transaction|transfer|new/i).first()).toBeVisible();
  }

  async createMintLikeTransaction(options?: { amount?: string; memo?: string }) {
    const amount = options?.amount || '1';
    const memo = options?.memo || `Playwright mint QA ${Date.now()}`;

    await this.selectFirstAvailableAccount(this.sourceAccountButton());
    await this.selectFirstAvailableAccount(this.destinationAccountButton());

    await this.amountInput().fill(amount);
    await this.memoInput().fill(memo);

    const submitButton = this.page.getByRole('button', {
      name: /submit|initiate|create|send|request|mint/i
    });
    await expect(submitButton).toBeEnabled({ timeout: 10000 });

    await Promise.all([
      this.page.waitForURL(/\/queue|\/transactions\/history|\/transactions/i, { timeout: 20000 }).catch(() => undefined),
      submitButton.click()
    ]);

    await expect(
      this.page.getByText(/submitted successfully|success|pending approval|queue|transaction request/i).first()
    ).toBeVisible({ timeout: 15000 });
  }

  async gotoHistory() {
    await this.page.goto('/transactions/history');
  }

  async expectHistoryLoaded() {
    await expect(this.page).toHaveURL(/\/transactions\/history/);
    await expect(this.page.getByText(/history|transaction/i).first()).toBeVisible();
  }

  sourceAccountButton(): Locator {
    return this.page.getByText(/source account/i)
      .locator('xpath=ancestor::*[self::div or self::section][1]')
      .getByRole('button')
      .first()
      .or(this.page.getByRole('button', { name: /select account/i }).nth(0));
  }

  destinationAccountButton(): Locator {
    return this.page.getByText(/destination account/i)
      .locator('xpath=ancestor::*[self::div or self::section][1]')
      .getByRole('button')
      .first()
      .or(this.page.getByRole('button', { name: /select account/i }).nth(1));
  }

  amountInput(): Locator {
    return this.page.getByPlaceholder('0.00').or(this.page.locator('input[type="number"]').first());
  }

  memoInput(): Locator {
    return this.page
      .getByPlaceholder(/treasury rebalancing|memo|reference|description/i)
      .or(this.page.locator('input[type="text"]').last());
  }

  private async selectFirstAvailableAccount(dropdownButton: Locator) {
    await dropdownButton.click();
    const option = this.page
      .locator('button')
      .filter({ hasText: /#|available|restricted balance|fiat|digital|wallet|account/i })
      .filter({ hasNotText: /select account|source|destination|submit/i })
      .first();
    await expect(option).toBeVisible({ timeout: 10000 });
    await option.click();
  }
}
