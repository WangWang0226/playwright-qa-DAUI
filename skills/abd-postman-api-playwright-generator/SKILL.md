---
name: abd-postman-api-playwright-generator
description: Use in the Digital Asset QA Playwright repo when asked to convert or update Playwright API tests from an attached/provided Postman collection JSON. This skill maps collection requests into API clients, scenario data, and Playwright request specs while preserving existing tests and coverage matrices.
---

# ABD Postman API Playwright Generator

Use this skill in the Digital Asset QA Playwright repo when the user provides a Postman collection or API request export and asks to create/update backend API tests.

## Repository Boundary

- This skill runs in the **QA Playwright repo only**.
- Product source repos are unavailable unless separately attached.
- Use only:
  - attached/provided Postman collection JSON or API request export
  - attached/provided API docs, if any
  - existing QA repo API clients, scenario data, specs, docs, and reporting scripts

## Skill Structure

This skill follows the ABD standard structure:

```text
abd-postman-api-playwright-generator/
├── SKILL.md
├── rules/
├── references/
├── templates/
├── scripts/
└── scanners/
```

Read the relevant rule/reference/template files before implementation:

- [rules/api-generation-rules.md](rules/api-generation-rules.md)
- [rules/security-rules.md](rules/security-rules.md)
- [references/postman-mapping.md](references/postman-mapping.md)
- [templates/playwright-api.spec.ts](templates/playwright-api.spec.ts)

## Input Handling

Do not require a specific collection filename.

Accept any user-attached or user-referenced JSON that follows Postman collection shape:

- top-level `info`
- top-level `item`
- nested folders under `item`
- request definitions with `method`, `url`, `header`, `body`, and optional test scripts

If multiple JSON files are attached, ask which collection should be converted unless the user clearly scopes the target.

## Conversion Workflow

1. Parse the collection structure and list folders/requests.
2. Identify auth/login/register requests.
3. Identify scenario requests, especially transaction/orchestration flows.
4. Extract request method, path, headers, body, collection variables, and Postman test assertions.
5. Compare against existing API clients, scenario data, and `tests/api` specs.
6. Update existing API clients instead of duplicating HTTP logic.
7. Move request payloads into `data/api-scenarios/`.
8. Generate or update Playwright API specs under `tests/api/`.
9. Add polling helpers for asynchronous transaction/orchestration flows.
10. Update coverage docs and scenario matrix docs when TC IDs or scenarios are added.
11. Run TypeScript validation.

## TC ID And Coverage Rules

- Preserve TC IDs if the provided docs or collection names include them.
- If TC IDs are missing, create deterministic `TC-API-...` IDs from the API domain and scenario order.
- Every generated spec test title must include at least one `TC-API-...` ID.
- Do not remove existing API tests unless they are exact duplicates and the stronger replacement remains.
- Update coverage matrix docs for newly added or changed TC IDs.

## Async API Rules

For transaction/orchestration flows:

- Do not pass immediately after submit unless the test case only covers request acceptance.
- Poll a status endpoint until the expected terminal success state.
- Fail immediately on terminal failure states such as `FAILED`, `REJECTED`, `CANCELLED`, `CANCELED`, or `ERROR`.
- Ensure Playwright `test.setTimeout(...)` is longer than the API polling timeout.

If the collection does not include a status endpoint for an async flow, ask for clarification before implementing a false-positive test.

## Final Response

Report:

- collection(s) read
- requests converted or skipped
- API clients updated
- scenario data added/updated
- specs added/updated
- TC IDs added/updated
- docs updated
- commands run and results
- unresolved API contract questions
