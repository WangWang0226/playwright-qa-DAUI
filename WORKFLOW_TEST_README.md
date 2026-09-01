# DAMUI Playwright QA Framework

This is an independent Playwright QA project for the deployed DAMUI environment.

## Setup

```bash
cd playwright-tests
npm install
npx playwright install chromium
cp .env.example .env
```

Default target:

```text
https://daui.34.36.111.7.nip.io
```

The setup test uses `DAMUI_ADMIN_USERNAME` / `DAMUI_ADMIN_PASSWORD`.
Simulation fallback is disabled by default. Enable it explicitly only for offline/mock environments:

```bash
DAMUI_ALLOW_SIMULATION_FALLBACK=true npm run auth:admin
```

## Common Commands

```bash
npm run auth:admin
npm run test:smoke
npm run test:functional
npm run test:workflow
npm test
npm run report
```

Headed mode:

```bash
DAMUI_HEADLESS=false npm test
DAMUI_HEADLESS=false DAMUI_SLOW_MO_MS=500 npm run test:smoke
npm run test:headed
```

Live data mutation tests are opt-in:

```bash
npm run auth:admin
npm run test:mint
```

Mint completion polling timeout can be adjusted:

```bash
DAMUI_MINT_COMPLETION_TIMEOUT_MS=240000 npm run test:mint
```

## Selector Discovery

Use this when the live UI differs from the local source:

```bash
npm run inspect:login
npm run inspect:page -- /dashboard
npm run inspect:page -- /transactions/new
npm run inspect:page -- /dashboard -- --no-auth
npm run inspect:storage
npm run inspect:history
npx playwright codegen https://daui.34.36.111.7.nip.io/login
```

Prefer sharing the generated locators or a small DOM snippet around the failing control. Full page source is usually noisy and less useful than Playwright-generated locators.
