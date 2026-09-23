# Transaction Scenario Matrix

This matrix tracks Digital Asset transaction operation-level coverage separately from requirement TC coverage. It includes OpsUI browser workflows and Orchestrator API scenarios.

## Automated Smoke Scenarios

### UI Workflows

| Flow | Network | Source | Destination | Amount | Spec |
| --- | --- | --- | --- | --- | --- |
| mint | SEPOLIA | US Customer Fiat Account / US Customer Vault | Sepolia Token (ETH_TEST5) / US Customer Vault | 5 | `tests/workflows/mint-transaction.workflow.spec.ts` |
| transfer | SEPOLIA | Sepolia Token (ETH_TEST5) / US Customer Vault | Sepolia Token (ETH_TEST5) / DDA Customer Vault 6 | 5 | `tests/workflows/transfer.workflow.spec.ts` |
| burn | SEPOLIA | Sepolia Token (ETH_TEST5) / DDA Customer Vault 6 | DDA Customer Fiat Account / DDA Customer Vault 6 | 5 | `tests/workflows/burn.workflow.spec.ts` |
| mint-transfer-burn | SEPOLIA | US Customer Fiat Account / US Customer Vault | DDA Customer Fiat Account / DDA Customer Vault 6 | 1 | `tests/workflows/mint-transfer-burn.workflow.spec.ts` |

### API Orchestration

| Flow | API path | Source | Destination | Amount | Spec |
| --- | --- | --- | --- | --- | --- |
| MINT | `POST /v1/transaction`, then poll `GET /v1/transaction/{txId}` | `fa-us-customer` | `5` | 100 | `tests/api/workflows/mint.workflow.api.spec.ts` |

## Candidate Scenarios

| Flow | Network | Source Type | Destination Type | Example | Status |
| --- | --- | --- | --- | --- | --- |
| mint | BESU | fiat | BESU wallet | US fiat to BESU wallet | needs confirmed live labels/history IDs |
| transfer | BESU | BESU wallet | BESU wallet | US BESU wallet to DDA BESU wallet | needs confirmed live labels/history IDs |
| burn | BESU | BESU wallet | fiat | DDA BESU wallet to DDA fiat | needs confirmed live labels/history IDs |
| mint-transfer-burn | BESU | fiat | fiat | US fiat to DDA fiat over BESU | needs confirmed backend behavior |
| mint | SOLANA | fiat | SOL wallet | US fiat to SOL wallet | needs confirmed live labels/history IDs |
| transfer | SOLANA | SOL wallet | SOL wallet | US SOL wallet to DDA SOL wallet | needs confirmed live labels/history IDs |
| burn | SOLANA | SOL wallet | fiat | DDA SOL wallet to DDA fiat | needs confirmed live labels/history IDs |
| mint-transfer-burn | SOLANA | fiat | fiat | US fiat to DDA fiat over SOLANA | needs confirmed backend behavior |
| mint-transfer | SEPOLIA/BESU/SOLANA | fiat | remote wallet | US fiat to DDA chain wallet | needs confirmed backend behavior |
| transfer-burn | SEPOLIA/BESU/SOLANA | wallet | fiat | US chain wallet to DDA fiat | needs confirmed backend behavior |
| same-vault transfer | SEPOLIA/BESU/SOLANA | wallet | wallet | same vault asset movement | needs product rule confirmation |
| negative transfer | any | ineligible wallet | wallet | archived wallet to active wallet | needs fixture |

## Scenario Data Source

Executable scenarios live in:

```text
data/scenarios/transaction-scenarios.ts
data/api-scenarios/mint-scenarios.ts
```

Add new source/destination combinations there instead of duplicating account data inside workflow or API specs.
