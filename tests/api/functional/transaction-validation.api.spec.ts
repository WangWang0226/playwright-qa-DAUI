import { expect, request, test } from '@playwright/test';
import { apiBaseUrl, apiCredentials } from '../../../api/env';

test.describe('Digital Asset Orchestrator API transaction validation', () => {
  test('TC-API-OPS-TXN-001 reject missing transaction payload fields', async () => {
    const credentials = apiCredentials();
    const apiContext = await request.newContext({
      baseURL: apiBaseUrl(),
      extraHTTPHeaders: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    });

    try {
      const response = await apiContext.post('/v1/transaction', {
        headers: {
          'X-User-Id': credentials.userId
        },
        data: {}
      });

      expect(response.status(), 'Incomplete transaction payload should be rejected').toBeGreaterThanOrEqual(400);
      expect(response.status(), 'Incomplete transaction payload should not return server error').toBeLessThan(500);
    } finally {
      await apiContext.dispose();
    }
  });

  test('TC-API-OPS-TXN-002 reject malformed transaction id lookup', async () => {
    const apiContext = await request.newContext({
      baseURL: apiBaseUrl(),
      extraHTTPHeaders: {
        Accept: 'application/json'
      }
    });

    try {
      const response = await apiContext.get('/v1/transaction/not-a-valid-transaction-id');

      expect(response.status(), 'Malformed transaction id should be rejected or not found').toBeGreaterThanOrEqual(400);
      expect(response.status(), 'Malformed transaction id should not return server error').toBeLessThan(500);
    } finally {
      await apiContext.dispose();
    }
  });
});
