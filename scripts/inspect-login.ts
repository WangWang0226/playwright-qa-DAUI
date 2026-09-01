import { chromium } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

const baseURL = process.env.DAMUI_BASE_URL || 'https://daui.34.36.111.7.nip.io';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto(`${baseURL.replace(/\/$/, '')}/login`, { waitUntil: 'domcontentloaded' });

const elements = await page.locator('input, button, a, [data-testid], [id]').evaluateAll(nodes =>
  nodes.map((node, index) => {
    const element = node as HTMLElement;
    return {
      index,
      tag: element.tagName.toLowerCase(),
      type: element.getAttribute('type'),
      id: element.id || null,
      testId: element.getAttribute('data-testid'),
      name: element.getAttribute('name'),
      placeholder: element.getAttribute('placeholder'),
      ariaLabel: element.getAttribute('aria-label'),
      text: element.innerText?.trim() || null
    };
  })
);

console.table(elements);

await browser.close();
