import { test } from '../../fixtures/roles.fixture';
import { mintScenarios, scenarioMemo } from '../../data/scenarios/transaction-scenarios';
import { MintWorkflowPage } from '../../pages/MintWorkflowPage';

test.skip(
  process.env.OPSUI_RUN_MUTATING_TESTS !== 'true',
  'Mint workflow creates live transaction data. Run with OPSUI_RUN_MUTATING_TESTS=true.'
);

for (const scenario of mintScenarios) {
  test(`${scenario.tcIds.join(' ')} ${scenario.name}`, async ({ adminPage }) => {
    test.setTimeout(180000);

    const workflow = new MintWorkflowPage(adminPage);
    await workflow.createApproveAndVerify({
      ...scenario,
      memo: scenarioMemo(scenario)
    });
  });
}
