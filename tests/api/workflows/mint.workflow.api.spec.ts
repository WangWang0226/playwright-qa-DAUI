import { expect, request, test } from '@playwright/test';
import { AuthApiClient } from '../../../api/AuthApiClient';
import { TransactionApiClient } from '../../../api/TransactionApiClient';
import { apiBaseUrl, apiCredentials } from '../../../api/env';
import { mintApiScenario } from '../../../data/api-scenarios/mint-scenarios';

test.describe('Digital Asset Orchestrator API workflows', () => {
  test.setTimeout(Number(process.env.OPSUI_API_TEST_TIMEOUT_MS || 240000));
  test.skip(
    process.env.OPSUI_RUN_API_MUTATION_TESTS !== 'true',
    'API workflow creates backend transaction data. Run with OPSUI_RUN_API_MUTATION_TESTS=true.'
  );

  test('TC-API-OPS-MINT-001 register, login, submit MINT, and get transaction status', async () => {
    const credentials = apiCredentials();
    const apiContext = await request.newContext({
      baseURL: apiBaseUrl(),
      extraHTTPHeaders: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    });

    try {
      const auth = new AuthApiClient(apiContext);
      const transactions = new TransactionApiClient(apiContext);

      await auth.register({
        username: credentials.username,
        email: credentials.email,
        password: credentials.password
      });

      const login = await auth.login({
        username: credentials.username,
        password: credentials.password
      });

      const submitted = await transactions.submitTransaction({
        userId: credentials.userId,
        token: login.token,
        transaction: mintApiScenario
      });

      expect(submitted.body).toMatchObject({
        transactionId: submitted.transactionId
      });

      const status = await transactions.waitForTransactionStatus({
        transactionId: submitted.transactionId,
        userId: credentials.userId,
        token: login.token,
        expectedStatus: 'COMPLETED'
      });

      expect(status.body.transactionId || status.body.id, 'Status response should belong to submitted transaction').toBe(
        submitted.transactionId
      );
      expect(status.body.initiatedByUserId, `Status response:\n${JSON.stringify(status.body, null, 2)}`).toBe(
        credentials.userId
      );
      expect(status.body.assetId, `Status response:\n${JSON.stringify(status.body, null, 2)}`).toBe(
        mintApiScenario.assetId
      );
      expect(status.body.amount, `Status response:\n${JSON.stringify(status.body, null, 2)}`).toBe(
        mintApiScenario.amount
      );
      expect(status.body.status, `Status response:\n${JSON.stringify(status.body, null, 2)}`).toBe('COMPLETED');
      expect(status.body.flowType, `Status response:\n${JSON.stringify(status.body, null, 2)}`).toMatch(/MINT/);
      expect(status.body.txOperations, `Status response:\n${JSON.stringify(status.body, null, 2)}`).toEqual(
        expect.any(Array)
      );
    } finally {
      await apiContext.dispose();
    }
  });
});
