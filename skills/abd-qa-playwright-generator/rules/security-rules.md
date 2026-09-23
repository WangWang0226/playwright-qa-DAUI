# Security Rules

- Do not print or commit secrets, cookies, storage state, API tokens, or local config values.
- Use environment variables for credentials and target URLs.
- Treat live mutation tests as opt-in.
- For destructive or state-changing API tests, require explicit mutation risk documentation.
