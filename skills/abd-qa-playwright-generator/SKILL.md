---
name: abd-qa-playwright-generator
description: Use in the Digital Asset QA Playwright repo when asked to generate, update, deduplicate, or verify Playwright UI/API scripts from an attached/provided implementation-aware spec. This skill reads only the QA repo structure and the provided spec, updates Page Objects/API clients/fixtures/tests, and asks clarifying questions before implementation when the spec conflicts with the current QA architecture or leaves critical behavior unclear.
---

# QA Playwright Generator

Use this skill in the Digital Asset QA Playwright automation repo. Its job is to implement Playwright automation from an attached/provided implementation-aware spec.

## Skill Structure

This skill follows the ABD standard structure:

```text
abd-qa-playwright-generator/
├── SKILL.md
├── rules/
├── references/
├── templates/
├── scripts/
└── scanners/
```

Read these files when relevant:

- [rules/implementation-rules.md](rules/implementation-rules.md)
- [rules/security-rules.md](rules/security-rules.md)
- [references/playwright-test-cases-spec-format.md](references/playwright-test-cases-spec-format.md)
- [templates/playwright-ui.spec.ts](templates/playwright-ui.spec.ts)
- [templates/playwright-api.spec.ts](templates/playwright-api.spec.ts)

## Repository Boundary

- This skill runs in the **QA Playwright repo only**.
- Assume product source repos such as Ops-UI and Orchestrator are separate and unavailable.
- Do not inspect or rely on product app source code.
- Use only:
  - attached/provided implementation-aware specs
  - current QA repo files
  - existing Page Objects, fixtures, scripts, config, and tests
  - existing API clients, API scenario data, and API tests
  - Playwright runtime/trace/inspection output when available

## Required Reference

Read [references/playwright-test-cases-spec-format.md](references/playwright-test-cases-spec-format.md) before consuming a spec. Validate that the provided spec follows the format.

## Critical Clarification Rule

If the spec conflicts with the current QA architecture, lacks required selectors/test data, or is ambiguous in a way that could create wrong or duplicate tests, **do not implement immediately**.

Ask concise clarifying questions first when any of these occur:

- TC ID already exists but expected behavior differs.
- Required role/session fixture does not exist.
- Required route or workflow is not represented in current Page Objects and the spec lacks enough locator detail.
- The spec says to mutate live data but does not mark mutation risk or expected cleanup/wait behavior.
- Expected assertions conflict with existing test behavior.
- Selector recommendations are missing or too fragile for a reliable implementation.
- The spec requires data the QA repo cannot access or create.

Proceed without asking only when a conservative implementation is clear and verifiable.

## Coverage Accountability Rule

You must account for **every TC ID** in the provided spec, unless the user explicitly scopes the request to a subset.

Do not silently ignore any test case, including cases marked `needs-live-verification`, `blocked`, or cases that appear risky because they mutate live data.

Before editing, build an internal coverage matrix with one row per TC ID:

| TC ID | Title | Readiness | Mutation Risk | Decision | Target File | Reason |
| --- | --- | --- | --- | --- | --- | --- |

Allowed `Decision` values:

- `implemented`: executable Playwright test was added or updated.
- `implemented-skipped`: a Playwright test placeholder was added with `test.skip(...)` because it is valuable for traceability but cannot safely run yet.
- `covered-by-existing`: existing script already covers the TC ID; update the test name/comment if needed so the TC ID is discoverable by `rg`.
- `needs-clarification`: implementation would be unreliable or wrong without user input.
- `blocked`: the UI route/component/backend control/test data does not exist or is unavailable from the QA repo.
- `out-of-scope`: only when the user explicitly scoped the generation request to a subset.

Rules:

- Every TC ID from the spec must end in exactly one of the allowed decisions.
- If the user asks to generate scripts from the whole spec, `out-of-scope` is not allowed.
- Cases marked `ready` should normally be `implemented` or `covered-by-existing`.
- Cases marked `needs-live-verification` should become either:
  - `implemented` with safe guards and clear test data, or
  - `implemented-skipped` with a precise reason, or
  - `needs-clarification` with specific questions.
- Cases marked `blocked` should not be implemented as fake passing tests. Prefer `implemented-skipped` placeholder specs only when that improves traceability without creating false confidence.
- For each `needs-clarification` row, ask concise questions before implementing if the user expects complete coverage in the current turn.
- Do not finish with only aggregate counts. The final response must include or reference the coverage matrix.

## First Pass: Inspect QA Repo

Before editing:

```bash
find . -maxdepth 3 -type f | sort
sed -n '1,220p' package.json
sed -n '1,220p' playwright.config.ts
find pages fixtures tests utils scripts -type f | sort
find api data -type f | sort
```

Read relevant existing:

- Page Objects in `pages/`
- fixtures in `fixtures/`
- tests in `tests/smoke`, `tests/functional`, `tests/workflows`
- API clients in `api/`
- API scenario data in `data/api-scenarios/`
- API tests in `tests/api/`
- scripts for inspection/reporting
- `.env.example`

## Spec Intake

Find the spec only if the user asks you to use a local file and does not provide a path:

```bash
rg --files -g 'playwright-test-cases*.md' -g '*test-cases*.md'
```

For each test case, extract:

- TC ID
- title
- type: smoke / functional / workflow
- API/backend test type when TC ID starts with `TC-API`
- role
- routes
- preconditions
- test data
- UI operation steps
- expected assertions
- recommended locators
- Page Object suggestions
- async/wait rules
- mutation risk
- automation readiness
- open questions
- transaction operation classification, if present
- transaction scenario matrix rows, if present

Create the coverage matrix immediately after extraction. Keep it updated as implementation proceeds.

For cases marked `blocked`, do not create executable assertions that merely check unrelated pages or generic page load. Either:

- create a skipped placeholder test that names the TC ID and explains the missing dependency, or
- mark the row `blocked` / `needs-clarification` and ask the user, depending on the user’s requested scope.

## Deduplication

Before creating a test, search by TC ID and behavior:

```bash
rg -n "TC-UI-|TC-API-|<TC ID>|<feature keyword>|<route>|<workflow>" tests pages fixtures utils
```

Rules:

- If the same TC ID exists, update the existing test instead of creating a duplicate.
- If a different TC ID already covers the same behavior, ask before merging/deleting.
- If duplicate specs exist, merge useful assertions into the canonical spec and delete the weaker duplicate only when the duplication is clear.
- Never delete a test solely because filenames are similar.

## Implementation Rules

Map cases to:

- `tests/smoke/` for fast environment checks
- `tests/functional/<feature-or-story>/` for single acceptance criteria
- `tests/workflows/` for cross-page/cross-role workflows
- `tests/api/` for backend/API tests that use Playwright `request`
- `tests/setup/` only for auth/session setup

Test names must include TC ID:

```ts
test('TC-UI-OPS-MINT-001 admin can initiate and approve mint transaction', async ({ adminPage }) => {
  ...
});
```

If one script covers multiple TC IDs, include all covered TC IDs in the test name:

```ts
test('TC-UI-OPS-MINT-004 TC-UI-OPS-MINT-006 admin can submit and approve mint transaction', async ({ adminPage }) => {
  ...
});
```

For cases that cannot safely run yet but should be represented in the repo, use a skipped placeholder with a concrete reason:

```ts
test.skip('TC-UI-OPS-BURN-001 burn transaction requires confirmed live source/destination account data', async () => {
  // Intentionally skipped until QA receives stable account labels and expected history fields.
});
```

Put UI operations in Page Objects:

- Extend existing Page Objects when possible.
- Create a new Page Object only for a distinct page/workflow.
- Keep specs short and business-readable.

Do not paste raw `codegen` output directly into specs. Convert it into Page Object methods and assertions.

Do not satisfy a TC ID by adding only a comment in an unrelated test. The TC ID must be discoverable in a test title or a clearly named skipped placeholder.

## API Test Implementation

For `TC-API-...` cases, use Playwright's `request` API. Do not use browser pages unless the TC explicitly requires UI plus API correlation.

Preferred structure:

```text
api/
data/api-scenarios/
tests/api/
```

Rules:

- Put reusable HTTP behavior in API client classes under `api/`.
- Put request payloads and flow scenario data under `data/api-scenarios/`.
- Keep specs under `tests/api/` short and business-readable.
- Do not paste large Postman request bodies directly into specs when they can be named scenario data.
- Preserve source Postman behavior only when it matches the current product contract.
- Add or update `.env.example` for API-specific variables such as base URL, credentials, timeout, and polling interval.
- Test names must include `TC-API-...`.
- For async transaction/orchestration APIs, do not pass immediately after submit unless the TC only covers request acceptance.
- Poll the status endpoint until the expected terminal success state, for example `CONFIRMED`.
- Fail immediately on terminal failure states such as `FAILED`, `REJECTED`, `CANCELLED`, `CANCELED`, or `ERROR`.
- Ensure Playwright `test.setTimeout(...)` is longer than the API polling timeout.

For transaction status responses shaped like:

```json
{
  "transactionId": "...",
  "flowType": "MINT",
  "status": "CONFIRMED",
  "initiatedByUserId": "testuser",
  "assetId": "ETH_TEST5",
  "amount": 100,
  "txOperations": []
}
```

Assert backend fields that actually exist in the API response. Do not assert UI-only labels such as visible account names unless the API response includes them.

## Data-Driven Transaction Workflows

For transaction workflows with source/destination account combinations, prefer data-driven tests over hardcoded account pairs in specs.

Create or update a shared scenario data file such as:

```text
data/scenarios/transaction-scenarios.ts
```

Each scenario should include:

- `name`
- `tcIds`
- `flow`: `mint | transfer | burn | mint-transfer | transfer-burn | mint-transfer-burn`
- `scenarioSet`: `smoke | regression`
- `network`
- `sourceAccount`
- `sourceVault` or another stable discriminator
- `destinationAccount`
- `destinationVault` or another stable discriminator
- `expectedSource`
- `expectedDestination`
- `expectedHistorySource`
- `expectedHistoryDestination`
- `amount`
- `memo` prefix

Workflow specs should iterate over scenario arrays:

```ts
for (const scenario of transferScenarios) {
  test(`${scenario.tcIds.join(' ')} ${scenario.name}`, async ({ adminPage }) => {
    await workflow.createApproveAndVerify({
      ...scenario,
      memo: scenarioMemo(scenario)
    });
  });
}
```

Rules:

- Do not duplicate account pair data across multiple `.spec.ts` files.
- Do not create one scenario file per network unless the repo already uses that pattern; prefer one shared scenario source with `network` as a scenario field.
- Do not leave source/destination as empty placeholders inside executable tests.
- For missing account pairs, add candidate rows to a scenario matrix doc and use skipped placeholders or clarification questions.
- Add a scenario matrix document such as `docs/transaction-scenario-matrix.md` when the spec includes multiple operation combinations.
- Keep smoke scenarios small and safe; reserve broad account-pair matrices for opt-in regression/full-matrix runs.
- Assume transaction workflow coverage should consider every supported blockchain network, not only the first network found in the current spec. Common network examples are `BESU`, `SEPOLIA`, and `SOLANA`.
- If a network lacks confirmed labels/history ids, represent it as a candidate scenario or skipped placeholder instead of omitting it.

## Locator Handling

Use locator recommendations from the spec in this order:

1. `getByTestId`
2. `getByRole`
3. `getByLabel`
4. `getByPlaceholder`
5. stable `getByText`
6. CSS/XPath only when unavoidable

If locators fail or are missing, use QA repo inspection scripts if available:

```bash
npm run inspect:page -- /target-route
npm run inspect:history
npm run inspect:storage
```

If the QA repo has no way to confirm locators and the spec is unclear, ask before implementing.

## Live Mutation Safety

For mutating workflows, require opt-in:

```ts
test.skip(
  process.env.OPSUI_RUN_MUTATING_TESTS !== 'true',
  'This workflow mutates live data. Run with OPSUI_RUN_MUTATING_TESTS=true.'
);
```

Use `test.setTimeout(...)` and `expect.poll(...)` for long-running backend processing.

Never pass a live workflow by matching old data. Snapshot existing IDs/rows first, then wait for a new matching record.

For mutating `needs-live-verification` workflows such as transfer, burn, mint, wallet creation, or backend failure simulation:

- Do not guess source/destination account combinations when multiple live options share the same visible name.
- Require stable selection criteria: display name plus vault/account id, or `data-testid`, or another unique visible field.
- Require expected Queue and History display values before writing final assertions.
- Prefer adding confirmed combinations to shared scenario data instead of hardcoding them directly in workflow specs.
- If these are missing, create a skipped placeholder or ask for clarification according to the coverage matrix decision.

## Verification

After edits, run:

```bash
npx tsc --noEmit
```

Then run the smallest relevant Playwright command:

```bash
npx playwright test <changed-spec> --no-deps
```

Then run the relevant suite when practical:

```bash
npm run test:api
npm run test:smoke
npm run test:functional
npm run test:workflow
```

For mutating tests, do not run unless the user explicitly approves:

```bash
npm run auth:admin
npm run test:mint
```

If a test fails:

1. Read `test-results/**/error-context.md`.
2. Inspect trace if needed.
3. Fix Page Objects/helpers, not just the spec.
4. Re-run the failed test.

## Final Response

Report:

- spec file read
- coverage matrix for every TC ID, or a path to a generated coverage matrix file plus a concise summary
- test cases implemented, implemented-skipped, covered-by-existing, needs-clarification, blocked, or out-of-scope
- files added/updated/deleted
- duplicate tests removed or merged
- commands run and results
- clarifying questions if implementation was blocked
- selector/data-testid gaps that should be fixed in the UI repo

The final response must explicitly call out any TC IDs from the spec that do not have executable Playwright coverage yet. Do not summarize them away.
