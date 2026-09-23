# Postman To Playwright Mapping

| Postman concept | Playwright QA repo target |
| --- | --- |
| Collection folder | `test.describe(...)` or scenario group |
| Request method + URL | API client method |
| Raw JSON body | `data/api-scenarios/*.ts` scenario payload |
| Collection variable | environment variable or scenario field |
| `pm.response.to.have.status(...)` | `expect(response).toBeOK()` or explicit status assertion |
| Saved variable such as `txId` | return value from API client method |
| Follow-up status request | polling helper in API client |
| Postman prerequest script | setup helper or explicit arrange step |

For transaction/orchestration flows, prefer this shape:

```text
register/login -> submit transaction -> capture transactionId -> poll status endpoint -> assert terminal success response
```
