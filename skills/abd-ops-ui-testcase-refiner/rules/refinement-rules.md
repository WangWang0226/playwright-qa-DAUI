# Refinement Rules

- Use attached/provided requirements and test case documents as the source of business intent.
- Inspect only the product repo where this skill is running.
- Do not inspect or assume files from the QA Playwright repo.
- Convert source test cases into implementation-aware automation specs.
- Do not generate Playwright `.spec.ts` scripts in this skill.
- Preserve existing TC IDs when provided.
- Mark unclear or source-missing behavior as `needs-clarification` or `blocked`; do not invent behavior.
- Prefer stable accessibility and `data-testid` locators over CSS classes or DOM indexes.
