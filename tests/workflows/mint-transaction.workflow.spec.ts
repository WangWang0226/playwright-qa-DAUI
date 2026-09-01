import { test } from '../../fixtures/roles.fixture';
import { MintWorkflowPage, type MintTransactionInput } from '../../pages/MintWorkflowPage';

test.skip(
  process.env.DAMUI_RUN_MUTATING_TESTS !== 'true',
  'Mint workflow creates live transaction data. Run with DAMUI_RUN_MUTATING_TESTS=true.'
);

test('admin can complete a mint transaction request', async ({ adminPage }) => {
  test.setTimeout(180000);

  const mintWorkflow = new MintWorkflowPage(adminPage);
  const mintTransaction: MintTransactionInput = {
    network: 'SEPOLIA',
    sourceAccount: 'US Customer Fiat Account US',
    destinationAccount: 'Sepolia Token (ETH_TEST5) US',
    expectedSource: 'US Customer Fiat Account',
    expectedDestination: 'US Customer Vault Wallet',
    expectedHistorySource: 'fa-us-customer',
    expectedHistoryDestination: '5-wallet-USDC',
    expectedInitiator: 'ops.admin',
    amount: '5',
    memo: `playwright auto testing ${Date.now()}`
  };

  await mintWorkflow.createApproveAndVerify(mintTransaction);
});
