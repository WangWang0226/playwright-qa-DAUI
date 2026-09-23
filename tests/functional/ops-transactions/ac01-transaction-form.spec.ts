import { test, expect } from '../../../fixtures/roles.fixture';
import { TransactionPage, type TransactionDraft } from '../../../pages/TransactionPage';

const liveMintDraft: TransactionDraft = {
  network: 'SEPOLIA',
  sourceAccount: 'US Customer Fiat Account',
  sourceVault: 'US Customer Vault',
  destinationAccount: 'Sepolia Token (ETH_TEST5)',
  destinationVault: 'US Customer Vault',
  amount: '5',
  memo: `playwright draft validation ${Date.now()}`
};

test('TC-UI-OPS-TXN-001 transaction form displays account selectors and required inputs', async ({ adminPage }) => {
  const transactionPage = new TransactionPage(adminPage);

  await transactionPage.gotoNewTransaction();
  await transactionPage.expectNewTransactionLoaded();
  await transactionPage.expectAccountDropdownsExposeOptions();
});

test('TC-UI-OPS-TXN-002 transaction form rejects incomplete input before submission', async ({ adminPage }) => {
  const transactionPage = new TransactionPage(adminPage);

  await transactionPage.gotoNewTransaction();
  await transactionPage.expectNewTransactionLoaded();
  await transactionPage.expectIncompleteInputIsRejected();
});

test.skip('TC-UI-OPS-TXN-003 transaction form confirms valid mint details before submission', async ({ adminPage }) => {
  const transactionPage = new TransactionPage(adminPage);

  await transactionPage.gotoNewTransaction();
  await transactionPage.expectNewTransactionLoaded();
  await adminPage.getByRole('button', { name: /BESU|SEPOLIA/i }).first().click();
  await adminPage.getByRole('button', { name: /^SEPOLIA$/i }).last().click();
  await adminPage.getByRole('button', { name: /select account/i }).first().click();
  await adminPage.locator('button').filter({ hasText: /^\s*US Customer Fiat Account/i }).first().click();
  await adminPage.mouse.click(260, 92);
  await adminPage.getByRole('button', { name: /select account/i }).first().click();
  await adminPage.locator('button').filter({ hasText: /^\s*Sepolia Token \(ETH_TEST5\)/i }).first().click();
  await transactionPage.amountInput().fill(liveMintDraft.amount);
  await transactionPage.memoInput().fill(liveMintDraft.memo);
  await transactionPage.expectDraftReady(liveMintDraft);
  await expect(adminPage).toHaveURL(/\/transactions\/new/);
});
