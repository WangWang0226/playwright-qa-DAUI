# API Generation Rules

- Use attached/provided Postman collection JSON as input.
- Do not require or assume a fixed collection filename.
- Convert repeated request behavior into API client methods.
- Convert request bodies into scenario data.
- Keep specs short and business-readable.
- Preserve collection intent, but prefer current product API contracts over stale Postman assertions.
- Add polling for async orchestration flows.
- Update docs and coverage matrices when new TC IDs are created.
- Ask before implementing when required env vars, auth flow, or terminal success status is unclear.
