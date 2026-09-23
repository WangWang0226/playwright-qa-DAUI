import { expect, request, test } from '@playwright/test';
import { apiBaseUrl, apiCredentials } from '../../../api/env';

test.describe('Digital Asset Orchestrator API auth validation', () => {
  test('TC-API-OPS-AUTH-002 reject login with invalid password', async () => {
    const credentials = apiCredentials();
    const apiContext = await request.newContext({
      baseURL: apiBaseUrl(),
      extraHTTPHeaders: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    });

    try {
      const response = await apiContext.post('/api/v1/auth/login', {
        data: {
          username: credentials.username,
          password: `invalid-${Date.now()}`
        }
      });

      expect(response.status(), 'Invalid password should not authenticate').toBeGreaterThanOrEqual(400);
      expect(response.status(), 'Invalid password should not return server error').toBeLessThan(500);
    } finally {
      await apiContext.dispose();
    }
  });
});
