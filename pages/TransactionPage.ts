import { expect, type Locator, type Page } from '@playwright/test';

export type TransactionDraft = {
  sourceAccount: string;
  sourceVault?: string;
  destinationAccount: string;
  destinationVault?: string;
  network?: string;
  amount: string;
  memo: string;
};

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
    await expect(this.page.getByRole('heading', { name: /initiate transaction|initiate transfer/i })).toBeVisible();
    await expect(this.page.getByText(/global clearing entry|source account/i).first()).toBeVisible();
    await expect(this.sourceAccountButton()).toBeVisible();
    await expect(this.destinationAccountButton()).toBeVisible();
    await expect(this.amountInput()).toBeVisible();
    await expect(this.memoInput()).toBeVisible();
  }

  async expectAccountDropdownsExposeOptions() {
    await this.sourceAccountButton().click();
    await expect(this.accountOption()).toBeVisible({ timeout: 10000 });
    await this.page.keyboard.press('Escape').catch(() => undefined);

    await this.destinationAccountButton().click();
    await expect(this.accountOption()).toBeVisible({ timeout: 10000 });
    await this.page.keyboard.press('Escape').catch(() => undefined);
  }

  async expectIncompleteInputIsRejected() {
    const submitButton = this.submitButton();
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeDisabled();
    await expect(this.page).toHaveURL(/\/transactions\/new/);
    await expect(this.page.getByText(/submitted successfully|transaction request .* submitted/i)).toHaveCount(0);
  }

  async fillDraft(data: TransactionDraft) {
    if (data.network) {
      await this.selectNetwork(data.network);
    }
    await this.selectSourceAccount(data.sourceAccount, data.sourceVault);
    await this.selectDestinationAccount(data.destinationAccount, data.destinationVault);
    await this.amountInput().fill(data.amount);
    await this.memoInput().fill(data.memo);
  }

  async expectDraftReady(data: TransactionDraft) {
    await expect(this.page.locator('button').filter({ hasText: new RegExp(escapeRegExp(data.sourceAccount), 'i') }).first()).toBeVisible();
    await expect(this.page.locator('button').filter({ hasText: new RegExp(escapeRegExp(data.destinationAccount), 'i') }).first()).toBeVisible();
    await expect(this.amountInput()).toHaveValue(data.amount);
    await expect(this.memoInput()).toHaveValue(data.memo);
    await expect(this.submitButton()).toBeEnabled();
    await expect(this.page.getByText(/submitted successfully|transaction request .* submitted/i)).toHaveCount(0);
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
    return this.page
      .getByTestId('transaction-source-account-dropdown')
      .or(this.page.getByRole('button', { name: /select account/i }).nth(0))
      .or(
        this.page
          .getByText(/source account/i)
          .locator('xpath=ancestor::*[self::div or self::section][1]')
          .getByRole('button')
          .first()
      );
  }

  destinationAccountButton(): Locator {
    return this.page
      .getByTestId('transaction-destination-account-dropdown')
      .or(this.page.getByRole('button', { name: /select account/i }).nth(1))
      .or(
        this.page
          .getByText(/destination account/i)
          .locator('xpath=ancestor::*[self::div or self::section][1]')
          .getByRole('button')
          .first()
      );
  }

  amountInput(): Locator {
    return this.page
      .getByTestId('transaction-amount-input')
      .or(this.page.getByRole('spinbutton', { name: /0\.00/i }))
      .or(this.page.getByPlaceholder('0.00'))
      .or(this.page.locator('input[type="number"]').first());
  }

  memoInput(): Locator {
    return this.page
      .getByTestId('transaction-memo-input')
      .or(
        this.page.getByRole('textbox', {
          name: /treasury rebalancing|memo|reference|description/i
        })
      )
      .or(
        this.page.getByPlaceholder(/treasury rebalancing|memo|reference|description/i)
      )
      .or(this.page.locator('input[type="text"]').last());
  }

  submitButton(): Locator {
    return this.page
      .getByTestId('transaction-submit-button')
      .or(
        this.page.getByRole('button', {
          name: /confirm transaction initiation|select source & destination|submit|initiate|create|send|request|mint|insufficient funds|accounts must differ|disabled|fiat-to-fiat|on-chain/i
        })
      );
  }

  async selectNetwork(network: string) {
    const currentNetwork = this.page.getByRole('button', { name: /BESU|SEPOLIA/i }).first();
    if (!(await currentNetwork.isVisible().catch(() => false))) {
      return;
    }

    await currentNetwork.click();
    await this.page.getByRole('button', { name: new RegExp(`^${escapeRegExp(network)}$`, 'i') }).last().click();
  }

  async selectSourceAccount(accountName: string, secondaryText?: string) {
    await this.page.getByRole('button', { name: /select account/i }).first().click();
    await this.accountOptionByText(accountName, secondaryText).click();
    await this.page.mouse.click(260, 92);
  }

  async selectDestinationAccount(accountName: string, secondaryText?: string) {
    await this.page.getByRole('button', { name: /select account/i }).last().click();
    await this.accountOptionByText(accountName, secondaryText).click();
    await this.page.mouse.click(260, 92);
  }

  private async selectFirstAvailableAccount(dropdownButton: Locator) {
    await dropdownButton.click();
    const option = this.accountOption();
    await expect(option).toBeVisible({ timeout: 10000 });
    await option.click();
  }

  private accountOption(): Locator {
    return this.page
      .locator('button')
      .filter({ hasText: /#|available|restricted balance|fiat|digital|wallet|account/i })
      .filter({ hasNotText: /select account|source|destination|submit/i })
      .first();
  }

  private accountOptionByText(primaryText: string, secondaryText?: string): Locator {
    let option = this.page
      .locator('button')
      .filter({ hasText: new RegExp(`^\\s*${escapeRegExp(primaryText)}`, 'i') })
      .filter({ hasNotText: /select account|clear selection|source account|destination account/i });

    if (secondaryText) {
      option = option.filter({ hasText: new RegExp(escapeRegExp(secondaryText), 'i') });
    }

    return option.first();
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
