import { test } from '../../fixtures/roles.fixture';
import { MintWorkflowPage, type MintTransactionInput } from '../../pages/MintWorkflowPage';

test.skip(
  process.env.OPSUI_RUN_MUTATING_TESTS !== 'true',
  'Pending mint workflow creates live transaction data. Run with OPSUI_RUN_MUTATING_TESTS=true.'
);

test('TC-UI-OPS-TXN-005 admin can submit a mint request that appears in pending approval queue', async ({ adminPage }) => {
  test.setTimeout(90000);

  const mintWorkflow = new MintWorkflowPage(adminPage);
  const pendingMint: MintTransactionInput = {
    network: 'SEPOLIA',
    sourceAccount: 'US Customer Fiat Account',
    sourceVault: 'US Customer Vault',
    destinationAccount: 'Sepolia Token (ETH_TEST5)',
    destinationVault: 'US Customer Vault',
    expectedSource: 'US Customer Fiat Account',
    expectedDestination: 'US Customer Vault Wallet',
    expectedInitiator: process.env.OPSUI_EXPECTED_INITIATOR || process.env.OPSUI_ADMIN_USERNAME,
    amount: '5',
    memo: `playwright pending approval ${Date.now()}`
  };

  await mintWorkflow.gotoNewTransaction();
  await mintWorkflow.selectNetwork(pendingMint.network);
  await mintWorkflow.selectSourceAccount(pendingMint.sourceAccount);
  await mintWorkflow.selectDestinationAccount(pendingMint.destinationAccount);
  await mintWorkflow.fillAmount(pendingMint.amount);
  await mintWorkflow.fillMemo(pendingMint.memo);
  await mintWorkflow.submitTransaction();
  await mintWorkflow.verifyTransactionReview(pendingMint);
});
