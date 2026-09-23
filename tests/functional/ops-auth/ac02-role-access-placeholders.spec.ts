import { test } from '@playwright/test';

test.skip('TC-UI-OPS-AUTH-002 block a user without transaction entitlement requires a seeded no-entitlement user', async () => {
  // Needs live credentials plus expected redirect/access-denied behavior.
});

test.skip('TC-UI-OPS-AUTH-003 preserve read-only access requires a seeded read-only user', async () => {
  // Needs live read-only credentials and direct-route behavior for /transactions/new and /queue.
});
