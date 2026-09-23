import { chromium } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

const baseURL = process.env.OPSUI_BASE_URL || 'https://daui.34.36.111.7.nip.io';
const path = process.argv[2] || '/dashboard';
const storageState = process.argv.includes('--no-auth') ? undefined : 'auth/admin.storageState.json';
const targetUrl = path.startsWith('http') ? path : `${baseURL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext(storageState ? { storageState } : undefined);
const page = await context.newPage();

await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

const elements = await page
  .locator('input, textarea, select, button, a, [role], [data-testid], [id]')
  .evaluateAll(nodes =>
    nodes.map((node, index) => {
      const element = node as HTMLElement;
      return {
        index,
        tag: element.tagName.toLowerCase(),
        role: element.getAttribute('role'),
        type: element.getAttribute('type'),
        id: element.id || null,
        testId: element.getAttribute('data-testid'),
        name: element.getAttribute('name'),
        placeholder: element.getAttribute('placeholder'),
        ariaLabel: element.getAttribute('aria-label'),
        text: element.innerText?.replace(/\s+/g, ' ').trim().slice(0, 140) || null
      };
    })
  );

console.log(`URL: ${page.url()}`);
console.table(elements);

await browser.close();
