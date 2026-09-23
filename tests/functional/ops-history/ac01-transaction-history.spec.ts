import { test } from '../../../fixtures/roles.fixture';
import { HistoryPage } from '../../../pages/HistoryPage';

test('TC-UI-OPS-HIST-002 transaction history supports filtering without leaving the page', async ({ adminPage }) => {
  const historyPage = new HistoryPage(adminPage);

  await historyPage.goto();
  await historyPage.expectLoaded();
  await historyPage.applyBasicFilters();
  await historyPage.expectRowsOrEmptyState();
});

test('TC-UI-OPS-HIST-004 transaction history exposes export action', async ({ adminPage }) => {
  const historyPage = new HistoryPage(adminPage);

  await historyPage.goto();
  await historyPage.expectLoaded();
  await historyPage.expectExportAvailable();
});
