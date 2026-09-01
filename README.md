# DAUI Playwright QA

Independent Playwright QA automation project for DAUI.

## Setup

```bash
npm install
npx playwright install chromium
cp .env.example .env
npm run auth:admin
```

## Common Commands

```bash
npm test
npm run test:smoke
npm run test:functional
npm run test:workflow
npm run test:mint
```

See [WORKFLOW_TEST_README.md](./WORKFLOW_TEST_README.md) for workflow, selector inspection, headed mode, and live mint test details.
