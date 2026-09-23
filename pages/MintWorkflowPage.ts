import { expect, type Page } from '@playwright/test';

export type MintTransactionInput = {
  sourceAccount: string;
  sourceVault?: string;
  destinationAccount: string;
  destinationVault?: string;
  expectedSource?: string;
  expectedDestination?: string;
  expectedHistorySource?: string;
  expectedHistoryDestination?: string;
  expectedInitiator?: string;
  network: string;
  amount: string;
  memo: string;
  completionTimeoutMs?: number;
};

export class MintWorkflowPage {
  readonly page: Page;
  private transactionId?: string;
  private completedHistoryId?: string;
  private existingHistoryIds = new Set<string>();

  constructor(page: Page) {
    this.page = page;
  }

  async createApproveAndVerify(input: MintTransactionInput) {
    this.transactionId = undefined;
    this.completedHistoryId = undefined;
    await this.captureExistingHistoryIds();
    await this.gotoNewTransaction();
    await this.selectNetwork(input.network);
    await this.selectSourceAccount(input.sourceAccount, input.sourceVault);
    await this.selectDestinationAccount(input.destinationAccount, input.destinationVault);
    await this.fillAmount(input.amount);
    await this.fillMemo(input.memo);
    await this.submitTransaction();
    await this.verifyTransactionReview(input);
    await this.approveTransaction();
    await this.waitForTransactionCompletedInHistory(input);
    await this.verifyHistory(input);
  }

  async gotoNewTransaction() {
    await this.page.goto('/transactions/new');
    await expect(this.page.getByRole('heading', { name: /initiate transaction|initiate transfer/i })).toBeVisible();
  }

  async selectNetwork(network: string) {
    const networkButton = this.page.getByRole('button', { name: /BESU|SEPOLIA/i }).first();
    await networkButton.click();
    await this.page.getByRole('button', { name: new RegExp(`^${escapeRegExp(network)}$`, 'i') }).last().click();
  }

  async selectSourceAccount(accountName: string, secondaryText?: string) {
    await this.page.getByRole('button', { name: 'Select account...' }).first().click();
    await this.accountOption(accountName, secondaryText).click();
    await this.page.mouse.click(260, 92);
  }

  async selectDestinationAccount(accountName: string, secondaryText?: string) {
    await this.page.getByRole('button', { name: 'Select account...' }).last().click();
    await this.accountOption(accountName, secondaryText).click();
    await this.page.mouse.click(260, 92);
  }

  async fillAmount(amount: string) {
    await this.page.getByRole('spinbutton', { name: '0.00' }).fill(amount);
  }

  async fillMemo(memo: string) {
    await this.page.getByRole('textbox', { name: /treasury rebalancing/i }).fill(memo);
  }

  async submitTransaction() {
    await expect(this.page.getByRole('button', { name: 'Confirm Transaction Initiation' })).toBeEnabled({
      timeout: 10000
    });
    await this.page.getByRole('button', { name: 'Confirm Transaction Initiation' }).click();
  }

  async verifyTransactionReview(input: MintTransactionInput) {
    const row = await this.pendingTransactionRow(input);
    this.transactionId = await row
      .locator('td, th')
      .first()
      .innerText()
      .then(text => extractTransactionId(text));

    await expect(row).toContainText(input.expectedSource || input.sourceAccount);
    await expect(row).toContainText(input.expectedDestination || input.destinationAccount);
    await expect(row).toContainText(input.network);
    if (input.expectedInitiator) {
      await expect(row).toContainText(input.expectedInitiator);
    }
    await expectAmountVisibleIn(row, input.amount);
  }

  async approveTransaction() {
    const row = this.transactionId
      ? this.page.getByRole('row').filter({ hasText: this.transactionId })
      : this.page.getByRole('row').filter({ has: this.page.getByRole('button', { name: 'Approve' }) }).last();
    const approveButton = row.getByRole('button', { name: 'Approve' });

    await expect(approveButton).toBeEnabled({ timeout: 10000 });
    await approveButton.click();
    await expect(this.page.getByText(/approved|completed|success|processing|confirmed/i).first()).toBeVisible({
      timeout: 30000
    });
  }

  async waitForTransactionCompletedInHistory(input: MintTransactionInput) {
    const timeout = input.completionTimeoutMs || Number(process.env.OPSUI_MINT_COMPLETION_TIMEOUT_MS || 180000);
    const startedAt = Date.now();
    const intervals = [3000, 5000, 10000];
    let attempts = 0;
    let lastObservedRow = '';

    while (Date.now() - startedAt < timeout) {
      await this.page.goto('/transactions/history');
      await this.page.waitForLoadState('domcontentloaded');

      const rowText = await this.matchingNewHistoryRowText(input);
      if (rowText) {
        lastObservedRow = rowText;

        if (failedPattern().test(rowText)) {
          throw new Error(`Transaction reached a failed terminal state in History: ${rowText}`);
        }

        if (completedPattern().test(rowText)) {
          return;
        }
      }

      await this.page.waitForTimeout(intervals[Math.min(attempts, intervals.length - 1)]);
      attempts += 1;
    }

    throw new Error(
      `Timed out after ${timeout}ms waiting for transaction to complete in History.` +
        (lastObservedRow ? ` Last observed matching row: ${lastObservedRow}` : ' No new matching History row was observed.')
    );
  }

  async verifyHistory(input: MintTransactionInput) {
    await this.page.goto('/transactions/history');
    await expect(this.page).toHaveURL(/\/transactions\/history/);

    const latestRow = this.page.locator('tbody tr').first();
    if (await latestRow.isVisible().catch(() => false)) {
      const row = this.completedHistoryRow(input);

      await expect(row).toContainText(input.expectedHistorySource || input.expectedSource || input.sourceAccount);
      await expect(row).toContainText(input.expectedHistoryDestination || input.expectedDestination || input.destinationAccount);
      await expect(row).toContainText(input.network);
      await expect(row).toContainText(completedPattern());
      await expectAmountVisibleIn(row, input.amount);
      return;
    }

    await expect(this.page.getByText(input.expectedHistorySource || input.expectedSource || input.sourceAccount).first()).toBeVisible();
    await expect(this.page.getByText(input.expectedHistoryDestination || input.expectedDestination || input.destinationAccount).first()).toBeVisible();
    await expect(this.page.getByText(input.network).first()).toBeVisible();
    await expect(this.page.getByText(completedPattern()).first()).toBeVisible();
    await expectAmountVisible(this.page, input.amount);
  }

  private async pendingTransactionRow(input: MintTransactionInput) {
    await expect(this.page).toHaveURL(/\/queue/);
    const row = this.page
      .getByRole('row')
      .filter({ hasText: input.network })
      .filter({ hasText: input.expectedSource || input.sourceAccount })
      .filter({ hasText: input.expectedDestination || input.destinationAccount })
      .filter({ has: this.page.getByRole('button', { name: 'Approve' }) })
      .first();
    await expect(row).toBeVisible({ timeout: 10000 });
    return row;
  }

  private completedHistoryRow(input: MintTransactionInput) {
    if (this.completedHistoryId) {
      return this.page.getByRole('row').filter({ hasText: this.completedHistoryId }).first();
    }

    return this.page
      .getByRole('row')
      .filter({ hasText: input.network })
      .filter({ hasText: input.expectedHistorySource || input.expectedSource || input.sourceAccount })
      .filter({ hasText: input.expectedHistoryDestination || input.expectedDestination || input.destinationAccount })
      .filter({ hasText: completedPattern() })
      .filter({ hasText: amountPattern(input.amount) })
      .first();
  }

  private async matchingNewHistoryRowText(input: MintTransactionInput) {
    let rows = this.page
      .getByRole('row')
      .filter({ hasText: input.network })
      .filter({ hasText: amountPattern(input.amount) });

    if (this.transactionId && isUuid(this.transactionId)) {
      rows = rows.filter({ hasText: this.transactionId });
    }

    const count = await rows.count();
    for (let index = 0; index < count; index += 1) {
      const row = rows.nth(index);
      const text = await row.innerText();
      const id = extractTransactionId(text);
      if (id && !this.existingHistoryIds.has(id)) {
        this.completedHistoryId = id;
        return text;
      }
    }

    return '';
  }

  private async captureExistingHistoryIds() {
    await this.page.goto('/transactions/history');
    await this.page.waitForLoadState('domcontentloaded');

    const rowTexts = await this.page.getByRole('row').evaluateAll(rows =>
      rows.map(row => (row as HTMLElement).innerText)
    );

    this.existingHistoryIds = new Set(rowTexts.map(extractTransactionId).filter((id): id is string => Boolean(id)));
  }

  private accountOption(accountName: string, secondaryText?: string) {
    let option = this.page
      .locator('button')
      .filter({ hasText: new RegExp(`^\\s*${escapeRegExp(accountName)}`, 'i') })
      .filter({ hasNotText: /select account|clear selection|source account|destination account/i });

    if (secondaryText) {
      option = option.filter({ hasText: new RegExp(escapeRegExp(secondaryText), 'i') });
    }

    return option.first();
  }
}

async function expectAmountVisible(page: Page, amount: string) {
  await expect(page.getByText(amountPattern(amount)).first()).toBeVisible();
}

async function expectAmountVisibleIn(locator: ReturnType<Page['locator']>, amount: string) {
  await expect(locator).toContainText(amountPattern(amount));
}

function amountPattern(amount: string) {
  const escapedAmount = escapeRegExp(amount);
  return new RegExp(`(?:\\$\\s*)?${escapedAmount}(?:\\.00)?(?!\\d)`);
}

function completedPattern() {
  return /completed|complete|confirmed|success|settled/i;
}

function failedPattern() {
  return /failed|failure|rejected|error|cancelled|canceled/i;
}

function extractHistoryId(text: string) {
  return text.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0];
}

function extractTransactionId(text: string) {
  return extractHistoryId(text) || text.match(/TX\d+/i)?.[0];
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
