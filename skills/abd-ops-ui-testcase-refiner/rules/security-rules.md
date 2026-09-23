# Security Rules

- Do not include secrets, passwords, tokens, cookies, or storage state contents in generated specs.
- Do not recommend committing local `.env` files.
- If credentials are needed, reference environment variables or test account placeholders.
- Avoid destructive UI actions unless the source requirement explicitly requires them and mutation risk is documented.
