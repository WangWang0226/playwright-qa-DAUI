---
name: abd-ops-ui-testcase-refiner
description: Use in the Ops-UI source repo when asked to refine attached/provided user stories, requirements, or test-case Markdown into UI-aware Playwright test case specifications. This skill reads only the UI repo source code plus the provided source test material, identifies routes/components/labels/locators/data-testid gaps, and outputs a portable implementation-aware spec for a separate QA Playwright repo to implement.
---

# Ops-UI Testcase Refiner

Use this skill in the Ops-UI application repo. Its job is to turn attached/provided UI-agnostic test cases into a UI-aware Playwright test case specification. It does **not** generate Playwright scripts.

## Skill Structure

This skill follows the ABD standard structure:

```text
abd-ops-ui-testcase-refiner/
├── SKILL.md
├── rules/
├── references/
├── templates/
├── scripts/
└── scanners/
```

Read these files when relevant:

- [rules/refinement-rules.md](rules/refinement-rules.md)
- [rules/security-rules.md](rules/security-rules.md)
- [references/playwright-test-cases-spec-format.md](references/playwright-test-cases-spec-format.md)
- [templates/playwright-test-cases-spec.md](templates/playwright-test-cases-spec.md)

## Repository Boundary

- This skill runs in the **Ops-UI repo only**.
- Assume the QA Playwright repo is separate and unavailable.
- Do not reference QA repo Page Objects, fixtures, or existing specs.
- Use only:
  - attached/provided test cases, requirements, user stories, acceptance criteria, or pasted requirements
  - current Ops-UI source code
  - route/component/form/state/API code available in this repo
- Output a portable implementation-aware spec that another skill can consume in the QA repo.

## Required Reference

Read [references/playwright-test-cases-spec-format.md](references/playwright-test-cases-spec-format.md) before writing the output spec. Follow that format.

## Inputs

Accept any attached/provided source material, for example:

- `test-cases.md`
- `requirements.md`
- user story Markdown
- Jira acceptance criteria Markdown
- POC docs
- pasted raw test cases

If the user asks you to discover local source documents and no attachment/path is provided, search:

```bash
rg --files -g '*.md'
```

Prioritize names containing:

```text
test-cases
requirements
requirement
user-story
story
acceptance
workflow
poc
```

## Source Code Discovery

Inspect the UI implementation before refining cases:

```bash
rg --files
rg -n "Route|Routes|path=|createBrowserRouter|BrowserRouter|router" .
rg -n "data-testid|aria-label|placeholder|label|button|select|input|textarea" src app pages components
```

Adjust paths to the repo framework. For React/Vite/Next apps, inspect likely folders:

```text
src/
app/
pages/
components/
routes/
features/
lib/
stores/
contexts/
```

Read only files relevant to the requirement. Prefer source-backed facts over guessing.

## Refinement Workflow

For each raw test case:

1. Identify feature, route, role, and business objective.
2. Map the case to concrete UI screens/components.
3. Extract actual visible labels, button text, placeholders, roles, and existing `data-testid` values.
4. Define deterministic UI operation steps suitable for Playwright.
5. Define assertions that prove the business outcome, not just navigation.
6. Identify async waits or polling needs.
7. Mark mutation risk if the test creates/approves/rejects/deletes/submits live data.
8. Add locator recommendations and selector stability notes.
9. Recommend missing `data-testid` values where selectors are fragile.

For transaction workflows, also classify the operation by source/destination account type:

- `mint`: fiat account -> digital asset wallet
- `transfer`: digital asset wallet -> digital asset wallet
- `burn`: digital asset wallet -> fiat account
- `mint-transfer`: fiat account -> remote digital asset wallet when backend performs mint plus transfer
- `transfer-burn`: digital asset wallet -> fiat account when backend performs transfer plus burn
- `mint-transfer-burn`: fiat account -> fiat account when backend performs mint plus transfer plus burn

Assume transaction products may support multiple blockchain networks. Do not treat the current network as fixed. Refined specs should model network as scenario data, not as a hardcoded test property.

Known network examples to look for in UI/source:

- `BESU`
- `SEPOLIA`
- `SOLANA`

When transaction workflows can be exercised by many account combinations, add a scenario matrix to the refined spec instead of describing only one hardcoded pair.

Recommended transaction scenario matrix fields:

```text
| Scenario ID | Flow | Network | Source Account | Source Vault/ID | Destination Account | Destination Vault/ID | Amount | Expected Queue Source | Expected Queue Destination | Expected History Source | Expected History Destination | Readiness |
```

If the UI source does not reveal stable source/destination IDs or final History labels, mark the scenario `needs-clarification` and list the missing values. Do not invent account IDs.

When source code shows supported networks but account data is incomplete, still include candidate scenario rows for each supported network and mark unknown source/destination/history values as `needs-clarification`.

## Output Rules

Create or update a single refined spec file unless the user requests otherwise. Use the user's requested output path when provided; otherwise use a clear name and report it.

Do not generate `.spec.ts` files.

Every test case must have a stable TC ID:

```text
TC-UI-<FEATURE>-001
TC-API-<FEATURE>-001
```

Examples:

```text
TC-UI-OPS-AUTH-001
TC-UI-OPS-MINT-001
TC-UI-OPS-APPROVAL-001
```

If raw TC IDs already exist, preserve them. If IDs are missing, create deterministic IDs from feature names and sequence numbers.

## Locator Guidance

Classify locators:

- `stable`: `data-testid`, accessible label, semantic role with stable name
- `acceptable`: placeholder, stable visible product text
- `fragile`: CSS class, DOM index, icon-only button, generated id, text that changes by state

Prefer recommending `data-testid` additions instead of forcing fragile locators.

Example recommendation:

```text
Recommended data-testid additions:
- transaction-network-dropdown
- transaction-source-account-dropdown
- transaction-destination-account-dropdown
- transaction-submit-button
- approval-queue-row
- transaction-status-badge
```

## Required Fields Per Test Case

Follow the reference format and include:

- TC ID
- title
- source requirement
- type: smoke / functional / workflow
- role
- route(s)
- preconditions
- test data
- UI operation steps
- expected assertions
- recommended locators
- Page Object suggestions
- async/wait rules
- mutation risk
- data-testid recommendations
- open questions

For transaction workflow test cases, include:

- operation classification (`mint`, `transfer`, `burn`, `mint-transfer`, `transfer-burn`, `mint-transfer-burn`)
- supported blockchain networks and which scenarios apply to each network
- scenario matrix rows for at least happy-path smoke coverage
- candidate scenario rows for broader regression coverage
- whether the scenario should be automated as executable, skipped placeholder, or clarification-needed
- source/destination disambiguation requirements such as vault name, account id, or recommended `data-testid`

## Handling Unknowns

Do not invent UI behavior that cannot be found in source code.

If source code is missing necessary details, record the gap in the output:

```text
Open questions:
- Cannot confirm exact completed status label from source.
- Cannot find stable selector for account dropdown option.
```

If a test cannot be made automation-ready from the UI source, still include it in the spec, but mark:

```text
Automation readiness: blocked
Blocked reason: ...
```

## Final Response

Report:

- raw requirement/test-case files read
- UI files inspected
- output spec path
- number of test cases refined
- unresolved UI gaps
- recommended `data-testid` additions

Do not mention QA repo implementation details beyond the portable spec contract.
