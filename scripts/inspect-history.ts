import { chromium } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

const baseURL = process.env.DAMUI_BASE_URL || 'https://daui.34.36.111.7.nip.io';
const browser = await chromium.launch({ headless: process.env.DAMUI_HEADLESS !== 'false' });
const context = await browser.newContext({ storageState: 'auth/admin.storageState.json' });
const page = await context.newPage();

await page.goto(`${baseURL.replace(/\/$/, '')}/transactions/history`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);

const rows = await page.getByRole('row').evaluateAll(nodes =>
  nodes.map((node, index) => ({
    index,
    text: (node as HTMLElement).innerText.replace(/\s+/g, ' ').trim()
  }))
);

console.table(rows.slice(0, 20));

const firstDataRow = page.getByRole('row').nth(2);
if (await firstDataRow.isVisible().catch(() => false)) {
  await firstDataRow.click();
  await page.waitForTimeout(1000);
  console.log('After first row click:');
  console.log((await page.locator('body').innerText()).replace(/\s+/g, ' ').trim().slice(0, 3000));
}

console.log('URL:', page.url());

await browser.close();
