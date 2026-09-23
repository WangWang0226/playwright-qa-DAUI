# Implementation Rules

- Use attached/provided implementation-aware specs as the automation contract.
- Account for every TC ID in the provided scope.
- Keep UI specs business-readable and move interactions into Page Objects.
- Keep API specs business-readable and move HTTP details into API clients plus scenario data.
- Do not silently drop blocked or unclear cases; create skipped placeholders or ask clarifying questions.
- Do not paste raw Codegen or large Postman bodies directly into final specs.
- Preserve existing tests unless a duplicate is clearly identified and the stronger canonical test remains.
