import { expect, request, test } from '@playwright/test';
import { AuthApiClient } from '../../../api/AuthApiClient';
import { apiBaseUrl, apiCredentials } from '../../../api/env';

test.describe('Digital Asset Orchestrator API smoke', () => {
  test('TC-API-OPS-AUTH-001 register API user if needed and login', async () => {
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

      await auth.register({
        username: credentials.username,
        email: credentials.email,
        password: credentials.password
      });

      const login = await auth.login({
        username: credentials.username,
        password: credentials.password
      });

      expect(login.body, 'Login response should return a JSON object').toEqual(expect.any(Object));
    } finally {
      await apiContext.dispose();
    }
  });
});
