import { test, expect } from '../../../fixtures/roles.fixture';

test('admin can access liquidity management', async ({ adminPage }) => {
  await adminPage.goto('/liquidity');

  await expect(adminPage).toHaveURL(/\/liquidity/);
  await expect(adminPage.getByText(/liquidity|vault|account/i).first()).toBeVisible();
});
