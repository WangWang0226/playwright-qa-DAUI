# Digital Asset Orchestrator API Test Guide

This project can run Digital Asset Orchestrator backend API tests with Playwright's `request` API. The API framework is separate from OpsUI browser Page Objects.

## Test Layers

API tests are split into three layers:

| Layer | Path | Purpose | Mutation behavior |
| --- | --- | --- | --- |
| Smoke | `tests/api/smoke` | Fast environment/auth reachability checks. | Minimal; register may create the test user once. |
| Functional | `tests/api/functional` | Endpoint-level validation and negative cases. | Should avoid successful business transactions. |
| Workflows | `tests/api/workflows` | Multi-step API E2E flows such as submit transaction then poll status. | Creates backend transaction data; guarded by `OPSUI_RUN_API_MUTATION_TESTS=true`. |

## Current Scope

The first migrated Postman flow is:

```text
TC-API-OPS-MINT-001
Register user if needed -> Login -> Submit MINT -> Poll transaction status until terminal success
```

Current source reference example:

```text
Da_Orchestration_E2E_Scenarios.postman_collection.json
```

Implemented files:

| File | Purpose |
| --- | --- |
| `api/AuthApiClient.ts` | Register/login API wrapper. |
| `api/TransactionApiClient.ts` | Submit transaction, get status, and poll status helpers. |
| `api/env.ts` | API base URL and credential env loading. |
| `data/api-scenarios/mint-scenarios.ts` | MINT request payload migrated from Postman. |
| `tests/api/smoke/auth.api.spec.ts` | Register/login smoke check. |
| `tests/api/functional/auth-validation.api.spec.ts` | Auth negative validation. |
| `tests/api/functional/transaction-validation.api.spec.ts` | Transaction validation negative tests. |
| `tests/api/workflows/mint.workflow.api.spec.ts` | Executable API MINT workflow E2E test. |

## Commands

Run all API specs:

```bash
npm run test:api
```

Run API smoke:

```bash
npm run test:api:smoke
```

Run API functional tests:

```bash
npm run test:api:functional
```

Run API workflows. Workflow specs are discovered but skipped unless mutation is enabled:

```bash
npm run test:api:workflow
```

Run only the minimal MINT API E2E:

```bash
npm run test:api:mint
```

## Environment Variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `OPSUI_API_BASE_URL` | `OPSUI_BASE_URL` | Orchestrator API target host. |
| `OPSUI_API_USERNAME` | optional; falls back to `OPSUI_ADMIN_USERNAME` | API user for register/login. |
| `OPSUI_API_EMAIL` | required | Registration email. |
| `OPSUI_API_PASSWORD` | optional; falls back to `OPSUI_ADMIN_PASSWORD` | API password. |
| `OPSUI_API_USER_ID` | optional; falls back to API/admin username | Value sent as `X-User-Id`. |
| `OPSUI_API_TEST_TIMEOUT_MS` | `240000` | Playwright test timeout for long-running API E2E tests. |
| `OPSUI_API_TRANSACTION_TIMEOUT_MS` | `180000` | Max wait for transaction status polling. |
| `OPSUI_API_TRANSACTION_POLL_INTERVAL_MS` | `5000` | Delay between status polling attempts. |
| `OPSUI_RUN_API_MUTATION_TESTS` | `false` | Enables API workflow specs that create backend transaction data. |

`OPSUI_API_TEST_TIMEOUT_MS` must be longer than `OPSUI_API_TRANSACTION_TIMEOUT_MS`; otherwise Playwright can stop the test before polling finishes.

Naming note: the `OPSUI_*` prefix is retained for compatibility with the current implementation. Conceptually, this repo now belongs to the Digital Asset team and covers both OpsUI and Orchestrator API tests.

## Assertion Rules

For orchestration APIs, do not assert UI-only fields such as visible account names. Assert the backend response schema:

- `transactionId`
- `flowType`
- `status`
- `initiatedByUserId`
- `assetId`
- `amount`
- `txOperations`

For successful flows, poll `GET /v1/transaction/{txId}` until the environment's expected terminal success status, currently:

```text
status === COMPLETED
```

Fail immediately on terminal failure states:

```text
FAILED, REJECTED, CANCELLED, CANCELED, ERROR
```

## Adding More API Flows

Use `abd-postman-api-playwright-generator` for recurring Postman/API collection updates. Use the same shape for additional migrated scenarios:

1. Add request payload to `data/api-scenarios/`.
2. Add or extend client methods under `api/`.
3. Add smoke specs under `tests/api/smoke/`, endpoint-level specs under `tests/api/functional/`, or E2E flows under `tests/api/workflows/`.
4. Include a `TC-API-...` ID in the test title.
5. Update `docs/test-coverage-matrix.md` and `docs/transaction-scenario-matrix.md`.

Keep API tests data-driven where possible. The remaining Postman flows to migrate are:

- `TRANSFER`
- `BURN`
- `MINT_TRANSFER`
- `TRANSFER_BURN`
- `MINT_TRANSFER_BURN`
- Solana Token-2022 variants
- webhook reconciliation/failure scenarios
- cross-chain scenarios
