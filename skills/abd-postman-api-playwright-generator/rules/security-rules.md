# Security Rules

- Never commit Postman secrets, bearer tokens, session cookies, passwords, or environment exports.
- Convert collection variables for secrets into environment variable references.
- Redact examples that include real credentials.
- Do not log full auth responses if they may contain tokens.
- Do not run mutating API tests unless the user asks for execution or the target environment is explicitly safe.
