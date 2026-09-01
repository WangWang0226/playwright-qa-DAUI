import { test, expect } from '../../fixtures/roles.fixture';
import { ApprovalQueuePage } from '../../pages/ApprovalQueuePage';
import { TransactionPage } from '../../pages/TransactionPage';

test('admin can move through core DAMUI workflow pages', async ({ adminPage }) => {
  const transactions = new TransactionPage(adminPage);
  const approvalQueue = new ApprovalQueuePage(adminPage);

  await transactions.gotoNewTransaction();
  await transactions.expectNewTransactionLoaded();

  await transactions.gotoHistory();
  await transactions.expectHistoryLoaded();

  await approvalQueue.goto();
  await approvalQueue.expectLoaded();

  await adminPage.goto('/liquidity');
  await expect(adminPage).toHaveURL(/\/liquidity/);
});
