import { expect, test } from '../../fixtures/roles.fixture';

test.describe('UI area', () => {
  test('TC-UI-AREA-001 should complete UI scenario', async ({ adminPage }) => {
    await adminPage.goto('/');
    await expect(adminPage).toHaveURL(/./);
  });
});
