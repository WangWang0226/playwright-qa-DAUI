# OpsUI UI Test Guide

This guide covers the OpsUI browser/UI side of the Digital Asset Playwright QA repo. Backend Orchestrator API tests are documented separately in `docs/API_TEST_README.md`.

## Mutation Safety

Workflow tests that create or approve transactions are guarded by:

```ts
OPSUI_RUN_MUTATING_TESTS=true
```

Without that variable, mutation specs are discovered but skipped.

## Authentication

Before running workflows:

```bash
npm run auth:admin
```

Run it again if dropdowns show no account options or the session redirects to login.

## Smoke/Functional Commands

```bash
npm run test:smoke       # UI smoke tests
npm run test:functional  # UI functional tests
```

| Command | Path | Purpose | Mutation behavior |
| --- | --- | --- | --- |
| `npm run test:smoke` | `tests/smoke` | Fast checks that the live OpsUI entry points and authenticated admin routes are reachable. | Does not intentionally create transaction data. |
| `npm run test:functional` | `tests/functional` | Feature-level UI checks such as auth redirects, transaction form validation, history filtering, and placeholder coverage for blocked cases. | Should avoid full live transaction submission. |

Use these suites for quick confidence after deployment or before running slower workflow tests.

## Workflow Commands

Workflow tests cover cross-page transaction flows. Some workflow specs create or approve live transaction data, so mutation flows are opt-in.

Single live workflow:

```bash
npm run test:mint
npm run test:transfer
npm run test:burn
npm run test:mint-transfer-burn
```

What each command does:

| Command | UI transaction submitted | Backend expectation |
| --- | --- | --- |
| `npm run test:mint` | Source fiat account to token account. | Backend creates a mint transaction and History eventually reaches completed state. |
| `npm run test:transfer` | Token account to token account. | Backend transfers token balance between vaults and History eventually reaches completed state. |
| `npm run test:burn` | Token account to fiat account. | Backend burns token balance and History eventually reaches completed state. |
| `npm run test:mint-transfer-burn` | Fiat account to fiat account. | This is one UI submission; backend executes the combined lifecycle. The test does not submit three separate transactions. |

All live lifecycle workflows:

```bash
npm run test:lifecycle
```

Default non-mutating workflow suite:

```bash
npm run test:workflow
```

In default mode, mutation workflows should skip.

## Headed / Slow Mode

Visible browser:

```bash
OPSUI_HEADLESS=false npm run test:transfer
```

Visible browser with slow action playback:

```bash
OPSUI_HEADLESS=false OPSUI_SLOW_MO_MS=500 npm run test:burn
OPSUI_HEADLESS=false OPSUI_SLOW_MO_MS=1000 npm run test:mint-transfer-burn
```

Completion timeout:

```bash
OPSUI_MINT_COMPLETION_TIMEOUT_MS=240000 npm run test:transfer
```

Environment behavior:

| Variable | Behavior |
| --- | --- |
| `OPSUI_HEADLESS=false` | Opens the browser for the command being run. |
| `OPSUI_SLOW_MO_MS=500` | Adds delay around browser actions. Useful when demoing to a human. |
| `OPSUI_RUN_MUTATING_TESTS=true` | Enables specs that create/approve live transactions. The mutation npm scripts set this automatically. |
| `OPSUI_MINT_COMPLETION_TIMEOUT_MS=240000` | Waits up to 4 minutes for History completion. Increase this when backend/webhook processing is slow. |

## Current Smoke Workflow Scenarios

Executable transaction scenarios live in:

```text
data/scenarios/transaction-scenarios.ts
```

Current active smoke coverage:

| Flow | Network | Source | Destination |
| --- | --- | --- | --- |
| mint | SEPOLIA | US Customer Fiat Account / US Customer Vault | Sepolia Token (ETH_TEST5) / US Customer Vault |
| transfer | SEPOLIA | Sepolia Token (ETH_TEST5) / US Customer Vault | Sepolia Token (ETH_TEST5) / DDA Customer Vault 6 |
| burn | SEPOLIA | Sepolia Token (ETH_TEST5) / DDA Customer Vault 6 | DDA Customer Fiat Account / DDA Customer Vault 6 |
| mint-transfer-burn | SEPOLIA | US Customer Fiat Account / US Customer Vault | DDA Customer Fiat Account / DDA Customer Vault 6 |

Add new account/network combinations to `data/scenarios/transaction-scenarios.ts` instead of duplicating data inside specs.

Supported operation categories to keep in the scenario matrix:

- `mint`
- `transfer`
- `burn`
- `mint-transfer`
- `transfer-burn`
- `mint-transfer-burn`

Supported networks should be represented as data, not hardcoded in specs. Known expected network labels:

- `BESU`
- `SEPOLIA`
- `SOLANA`

If a network/account pair is not yet confirmed in the live UI, add it to `docs/transaction-scenario-matrix.md` as candidate or blocked coverage instead of creating a fake passing test.

## Success / Failure Detection

The workflow Page Object:

1. snapshots existing History transaction IDs before submission;
2. submits the transaction and approves it from Queue;
3. polls History for a new matching row by network + amount;
4. immediately fails if the new row reaches `FAILED`, `REJECTED`, `ERROR`, or cancelled state;
5. passes only after the new row reaches completed/confirmed/settled state;
6. verifies source, destination, network, amount, and status.

This avoids passing by matching old rows.

Failure behavior:

- If History shows a new matching row with `FAILED`, `REJECTED`, `ERROR`, or cancelled state, the test fails immediately.
- If no new matching row reaches completed/confirmed/settled status before timeout, the test fails with a timeout.
- Source/destination labels are asserted after the completed row is found, because live History sometimes displays backend account IDs rather than dropdown labels.

## Selector Discovery

Useful commands:

```bash
npm run inspect:page -- /transactions/new
npm run inspect:history
npm run inspect:storage
npx playwright codegen https://daui.34.36.111.7.nip.io/login
```

Recommended process for a new workflow:

1. Run Codegen and manually complete the workflow once.
2. Save the generated locator sequence or relevant snippets.
3. Update the implementation-aware test spec or scenario matrix.
4. Ask Skill 2 to generate/refine the script using the QA repo plus the codegen output.

## Reports

```bash
npm run confluence:report -- --dry-run
npm run confluence:report -- --update-confluence
```

The report currently uses static coverage:

- `test(...)` or scenario `tcIds` = active coverage
- `test.skip(...)` = skipped/blocked
- TC ID in spec but not covered = pending

For runtime evidence, also open the Playwright HTML report:

```bash
npm run report
```

That report shows the latest run's pass/fail/trace/screenshots. The Confluence report is currently a coverage/status report, not a historical execution dashboard.
