# Digital Asset Playwright QA

Independent Playwright QA automation repo for the Digital Asset team. This repo contains browser UI tests for OpsUI and backend API tests for the Digital Asset Orchestrator.

Default target:

```text
https://daui.34.36.111.7.nip.io
```

## What This Repo Contains

| Area | Location | Purpose |
| --- | --- | --- |
| OpsUI UI tests | `tests/smoke`, `tests/functional`, `tests/workflows` | Browser-based Playwright coverage for login, navigation, transaction forms, approval queue, history, and live workflows. |
| Orchestrator API tests | `tests/api` | Playwright `request` based backend API coverage migrated from Postman/API scenarios. |
| UI Page Objects | `pages` | OpsUI interaction abstractions. |
| API clients | `api` | Digital Asset Orchestrator API wrappers for auth, transactions, and future API domains. |
| Test data | `data` | UI workflow scenarios and API request payloads. |
| QA docs | `docs` | Detailed usage, workflow, API, coverage, and handoff documentation. |
| Reporting | `scripts/generate-confluence-report.ts` | Generates local coverage output and optional Confluence report updates. |

## Quick Start

```bash
cd playwright-tests
npm install
npx playwright install chromium
cp .env.example .env
npm run auth:admin
```

## Common Commands

```bash
npm run test:smoke       # UI smoke tests
npm run test:functional  # UI functional tests
npm run test:workflow    # UI workflow tests; live mutation specs skip unless enabled
npm run test:api         # backend API tests
npm run test:api:smoke   # backend API smoke tests
npm run test:api:functional # backend API endpoint validation tests
npm run test:api:mint    # minimal API MINT E2E
npm run report           # open latest Playwright HTML report
```

Live UI workflow mutation commands:

```bash
npm run test:mint
npm run test:transfer
npm run test:burn
npm run test:mint-transfer-burn
npm run test:lifecycle
```

## Main Documents

- [QA_OVERALL_GUIDE.md](./docs/QA_OVERALL_GUIDE.md): Digital Asset QA ownership flow, Skill 1/Skill 2 workflow, reporting, and handoff guidance.
- [UI_TEST_README.md](./docs/UI_TEST_README.md): OpsUI test commands, headed/slow mode, workflow mutation safety, selectors, and transaction scenario rules.
- [API_TEST_README.md](./docs/API_TEST_README.md): Orchestrator API test architecture, env vars, Postman migration, and polling rules.
- [test-coverage-matrix.md](./docs/test-coverage-matrix.md): TC-level automation status.
- [transaction-scenario-matrix.md](./docs/transaction-scenario-matrix.md): transaction workflow/API scenario coverage.

## Source Specs

- Source QA test cases: attached/provided from the digital-asset-context docs workflow. Current repo example: [qa-source-test-cases.md](./qa-source-test-cases.md).
- Implementation-aware automation spec: attached/provided to the Playwright generator workflow. Current repo example: [playwright-test-cases.spec.md](./playwright-test-cases.spec.md).

Keep detailed test instructions in `docs/`; keep this README as the high-level entry point.
