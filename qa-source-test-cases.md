# POC Ops UI Test Cases

## 1. Purpose

This document defines behavior-focused test cases for the Digital Assets POC *Ops UI* / *DASH UI*. It is a QA handoff specification for converting the cases into Playwright tests.

The cases cover authentication, entitlement, transaction initiation and approval, mint/transfer/burn outcomes, wallet management, transaction status/history, filtering, export, error handling, and basic operational visibility.

The document specifies observable behavior. It does not prescribe Playwright selectors, API implementation, database queries, or component structure.

## 2. Source Context

| Source | Relevant scope |
| --- | --- |
| `initiative/mvp-foundation/discovery/poc story map.md` | Ops UI transaction initiation, account/wallet selection, mint/transfer/burn lifecycle, status/history, error handling |
| `initiative/mvp-foundation/discovery/detailed manual story map.md` | DASH navigation and entitlement, transaction initiation/approval, wallet management, status/history, monitoring |
| `initiative/mvp-foundation/discovery/mvp-req.md` | MVP tokenized-deposit objective and DASH as the user entry interface |
| `markdown/3. POC Execution/V2_Orchestration_Engine_Overview.md` | Mint/transfer/burn lifecycle, asynchronous status, durable state, retry and idempotency concerns |
| `markdown/3. POC Execution/Fireblocks Docs/Fireblocks Release Runbook - Template.md` | Fireblocks minting, TAP approval, vault/wallet roles, token supply verification |
| `context/3. POC Execution/Code/Core simulator/swagger.yml` | Health, account, posting, transaction status, account and transaction inquiry simulator routes |

## 3. Scope and Test Strategy

### 3.1 In scope

The primary actor is an authorised *Operations User*. The test oracle is the combination of:

1. visible *DASH UI* state and messages;
2. transaction status and reference shown by the UI;
3. permitted network responses or test doubles used by the QA environment;
4. resulting account, wallet, token, and transaction state where the environment exposes it.

### 3.2 Out of scope

- Fireblocks Console administration as a standalone product test
- direct contract deployment and upgrade testing
- full user-group provisioning, currently assigned to MVP2
- production performance, disaster recovery, and seven-year audit-retention testing

### 3.3 Test levels

| Level | Purpose | Playwright treatment |
| --- | --- | --- |
| UI-only | Navigation, field validation, entitlement, visible state | Browser assertions and controlled route responses |
| UI plus service stub | Deterministic reserve, Fireblocks, webhook, and failure outcomes | `page.route()` or QA fixture equivalent |
| UI plus integrated POC | End-to-end token lifecycle and status propagation | Real POC services and seeded test data |

## 4. Domain Vocabulary

| Term | Meaning |
| --- | --- |
| *Operations User* | User who initiates or approves POC operations through DASH |
| *DASH UI* | Operational UI used to initiate transactions and view operational data |
| *Account* | Fiat-core account used as the source or destination of a transaction |
| *Wallet* | Digital-asset wallet associated with a vault and account/ledger relationship |
| *Mint Transaction* | Operation that creates tokenized value backed by a fiat reserve and allocates it to a wallet |
| *Transfer Transaction* | Operation that moves tokenized value from one wallet to another |
| *Burn Transaction* | Operation that destroys tokenized value and supports fiat release |
| *Fiat Reserve* | Fiat amount reserved before a mint can complete |
| *Transaction Status* | Lifecycle state displayed for a submitted operation |
| *Transaction Reference* | Identifier used to locate a submitted operation |
| *Entitlement* | Permission controlling access to a DASH function or action |
| *TAP Approval* | Fireblocks transaction authorization policy approval required by the configured policy |

## 5. Environment and Seed Data

The values below are synthetic but realistic. Replace them with the QA repository's canonical fixtures.

### 5.1 Users

| Fixture ID | User | Role / entitlement | Use |
| --- | --- | --- | --- |
| `USR-OPS-001` | `Alice Chen` | Operations User; initiate and view transactions | Happy paths |
| `USR-APP-001` | `Ben Wong` | Operations Approver; approve transactions | Approval cases |
| `USR-READ-001` | `Casey Singh` | Read-only transaction history | Read-only cases |
| `USR-NONE-001` | `Drew Martin` | No DASH transaction entitlement | Access-denial cases |

### 5.2 Accounts and wallets

| Fixture ID | Type | Currency / asset | State | Use |
| --- | --- | --- | --- | --- |
| `ACC-CA-OPS-001` | Fiat source Account | CAD | Active; available balance `250,000.00` | Mint and transfer source |
| `ACC-US-OPS-001` | Fiat destination Account | USD | Active | Burn destination |
| `WAL-CA-OPS-001` | Wallet | USDC | Active; balance `0.00` | Mint destination |
| `WAL-US-OPS-001` | Wallet | USDC | Active; balance `5,000.00` | Transfer and burn source |
| `WAL-ARCH-001` | Wallet | USDC | Archived/ineligible | Negative wallet case |

### 5.3 Transaction examples

| Fixture ID | Type | Amount | Source | Destination | Use |
| --- | --- | ---: | --- | --- | --- |
| `MINT-UI-001` | Mint | `1,000.00 USDC` | `ACC-CA-OPS-001` | `WAL-CA-OPS-001` | Successful mint |
| `MINT-UI-002` | Mint | `250,000.01 USDC` | `ACC-CA-OPS-001` | `WAL-CA-OPS-001` | Insufficient reserve |
| `TRANSFER-UI-001` | Transfer | `500.00 USDC` | `WAL-US-OPS-001` | `WAL-CA-OPS-001` | Successful transfer |
| `BURN-UI-001` | Burn | `500.00 USDC` | `WAL-US-OPS-001` | `ACC-US-OPS-001` | Successful burn and release |

### 5.4 Deterministic service outcomes

| Fixture | Outcome |
| --- | --- |
| `mint-success` | Fiat reserve succeeds; Fireblocks mint succeeds; webhook reaches successful |
| `mint-pending-approval` | Submission is accepted and waits for TAP approval |
| `mint-reserve-rejected` | Fiat reserve rejects the requested amount |
| `mint-fireblocks-failed` | Fireblocks rejects or fails the mint |
| `mint-webhook-delayed` | Mint remains processing until the webhook arrives |
| `transfer-success` | Wallet-to-wallet transfer reaches successful |
| `burn-success` | Burn succeeds and fiat release completes |
| `service-unavailable` | A dependent service returns an unavailable/error outcome |

## 6. Common Preconditions

Unless a case overrides them:

1. The POC environment is reachable and test data has been reset.
2. Relevant *Account* and *Wallet* fixtures exist with the stated balances.
3. The test user is authenticated through the QA environment's supported login mechanism.
4. The QA runner can observe or stub service outcomes without asserting implementation-specific request internals.
5. The test captures the resulting *Transaction Reference* whenever the UI displays one.

## 7. Test Cases

### 7.1 Authentication and entitlement

#### OPS-AUTH-001 — Open the Ops UI after successful login

**Story:** Access Ops UI after successful login  
**Priority:** P0  
**Level:** UI-only

**Given** an authenticated *Operations User* `Alice Chen` has DASH access  
**When** the user opens the POC *DASH UI*  
**Then** the landing page is visible  
**And** navigation exposes only entitled operational functions  
**And** no unauthenticated login control remains active  

**Playwright assertions:** landing route or heading; entitled navigation; authenticated session state.

#### OPS-AUTH-002 — Block a user without transaction entitlement

**Story:** Enforce Ops UI entitlement  
**Priority:** P0  
**Level:** UI-only

**Given** `Drew Martin` has no transaction entitlement  
**When** the user opens the transaction-initiation destination directly  
**Then** the UI denies access or redirects to the permitted landing page  
**And** an access-denied message or protected state is visible  
**But** the user cannot see or submit transaction controls  

**Playwright assertions:** final URL or protected-page state; no submit control; no transaction form fields.

#### OPS-AUTH-003 — Preserve read-only access

**Story:** Apply read-only transaction entitlement  
**Priority:** P1  
**Level:** UI-only

**Given** `Casey Singh` has read-only transaction-history entitlement  
**When** the user opens transaction history  
**Then** transaction records and filters are visible  
**But** transaction-initiation and transaction-approval actions are not available  

**Playwright assertions:** history rows visible; initiate/approve controls hidden or disabled according to the agreed UI contract.

### 7.2 Transaction initiation

#### OPS-TXN-001 — Display accounts and wallets for transaction initiation

**Story:** Initiate transaction from Ops UI  
**Priority:** P0  
**Level:** UI plus service stub

**Given** `Alice Chen` has transaction-initiation entitlement  
**And** `ACC-CA-OPS-001`, `WAL-CA-OPS-001`, and the `USDC` token allocation are available  
**When** the user opens transaction initiation  
**Then** the UI displays transaction type and amount controls  
**And** source *Account* `ACC-CA-OPS-001` is selectable  
**And** destination *Wallet* `WAL-CA-OPS-001` is selectable for a *Mint Transaction*  
**And** available balance or reserve capacity is displayed as a domain value  

**Playwright assertions:** form reachability; controls; expected account/wallet options; amount or reserve display.

#### OPS-TXN-002 — Reject incomplete transaction input

**Story:** Validate transaction initiation input  
**Priority:** P0  
**Level:** UI-only

**Given** the transaction-initiation form is open  
**When** `Alice Chen` submits without a transaction type, source *Account*, destination *Wallet*, or positive amount  
**Then** the UI identifies each missing or invalid input  
**But** no *Transaction Reference* is displayed  
**And** no transaction is shown in processing or successful state  

**Playwright assertions:** field-level validation; blocked submission or error; no success notification.

#### OPS-TXN-003 — Confirm valid mint details before submission

**Story:** Review mint transaction details  
**Priority:** P0  
**Level:** UI-only

**Given** `Alice Chen` entered `1,000.00 USDC` for a *Mint Transaction*  
**And** `ACC-CA-OPS-001` is the source *Account*  
**And** `WAL-CA-OPS-001` is the destination *Wallet*  
**When** the user continues to review the request  
**Then** the confirmation state shows type, amount, source *Account*, and destination *Wallet*  
**And** the user can confirm or cancel the request  
**But** no *Transaction Reference* is shown before submission  

**Playwright assertions:** exact domain values in confirmation; cancel returns without creating a transaction.

#### OPS-TXN-004 — Submit a valid mint request

**Story:** Submit mint transaction  
**Priority:** P0  
**Level:** UI plus stub or integrated POC

**Given** the reviewed *Mint Transaction* is `1,000.00 USDC` from `ACC-CA-OPS-001` to `WAL-CA-OPS-001`  
**And** the `mint-success` service outcome is configured  
**When** `Alice Chen` confirms the request  
**Then** the UI displays a *Transaction Reference*  
**And** the *Transaction Status* changes through the configured processing state  
**And** the final state is *successful*  
**And** the destination *Wallet* displays the resulting token balance increase when balance refresh is supported  

**Playwright assertions:** capture reference; status transition or eventual successful state; destination balance when exposed.

#### OPS-TXN-005 — Keep a mint request pending approval

**Story:** Display mint transaction awaiting approval  
**Priority:** P0  
**Level:** UI plus stub or integrated POC

**Given** the `mint-pending-approval` outcome requires *TAP Approval*  
**When** `Alice Chen` submits `MINT-UI-001`  
**Then** the UI displays its *Transaction Reference* and pending-approval *Transaction Status*  
**And** the request appears in the approval queue for `Ben Wong`  
**But** the destination *Wallet* is not shown as successfully funded before approval completes  

**Playwright assertions:** initiator status; approver queue row; no premature success or balance increase.

#### OPS-TXN-006 — Approve a pending mint request

**Story:** Approve mint transaction  
**Priority:** P0  
**Level:** UI plus stub or integrated POC

**Given** `MINT-UI-001` is pending *TAP Approval*  
**And** `Ben Wong` has approval entitlement  
**When** the approver opens the request and confirms approval  
**Then** the request leaves pending approval  
**And** the UI displays processing or successful *Transaction Status*  
**And** the approved *Transaction Reference* remains searchable in transaction history  

**Playwright assertions:** approval action; status transition; history lookup by reference.

#### OPS-TXN-007 — Reject a mint when the fiat reserve is unavailable

**Story:** Reject mint transaction without fiat reserve  
**Priority:** P0  
**Level:** UI plus service stub

**Given** the `mint-reserve-rejected` outcome is configured for `MINT-UI-002`  
**When** `Alice Chen` submits `250,000.01 USDC` from `ACC-CA-OPS-001`  
**Then** the UI displays a failed or rejected *Transaction Status* with an actionable reserve error  
**But** no successful mint is shown  
**And** the destination *Wallet* balance remains unchanged  

**Playwright assertions:** failure status/message; no success toast; unchanged balance where available.

#### OPS-TXN-008 — Display a Fireblocks mint failure

**Story:** Display failed mint transaction  
**Priority:** P0  
**Level:** UI plus service stub

**Given** the fiat reserve is successful  
**And** the `mint-fireblocks-failed` outcome is configured  
**When** `Alice Chen` submits `MINT-UI-001`  
**Then** the UI displays a failed *Transaction Status* and an operator-readable Fireblocks failure reason  
**But** the UI does not display the request as successful  
**And** the failed operation remains locatable by its *Transaction Reference*  

**Playwright assertions:** failed state; failure reason; reference remains available; no false success.

#### OPS-TXN-009 — Avoid duplicate mint submission

**Story:** Prevent duplicate transaction submission  
**Priority:** P0  
**Level:** UI plus stub or integrated POC

**Given** `Alice Chen` submitted `MINT-UI-001` and the request is processing  
**When** the user reloads the page or attempts to submit the same request again  
**Then** the UI shows the existing *Transaction Reference* and current *Transaction Status* where the request is identifiable  
**But** the UI does not show two successful mint operations for the same submission  

**Playwright assertions:** pending submit protection or duplicate handling; one reference; one balance change.

### 7.3 Transfer and burn

#### OPS-LIFE-001 — Submit a wallet-to-wallet transfer

**Story:** Submit transfer transaction  
**Priority:** P0  
**Level:** UI plus stub or integrated POC

**Given** `WAL-US-OPS-001` has at least `500.00 USDC` available  
**And** `WAL-CA-OPS-001` is an active destination *Wallet*  
**And** the `transfer-success` outcome is configured  
**When** `Alice Chen` submits `500.00 USDC` from `WAL-US-OPS-001` to `WAL-CA-OPS-001`  
**Then** the UI displays a *Transaction Reference* and successful *Transaction Status*  
**And** source and destination wallet balances reflect the completed *Transfer Transaction* when balance refresh is supported  

**Playwright assertions:** transfer values; status/reference; both balance deltas where exposed.

#### OPS-LIFE-002 — Prevent transfer from an ineligible wallet

**Story:** Reject transfer from ineligible wallet  
**Priority:** P1  
**Level:** UI plus service stub

**Given** `WAL-ARCH-001` is archived or otherwise ineligible  
**When** `Alice Chen` selects the wallet for a *Transfer Transaction*  
**Then** the UI marks the wallet unavailable or displays its eligibility reason  
**But** the user cannot submit a transfer from that wallet  

**Playwright assertions:** disabled option or validation message; no transaction reference.

#### OPS-LIFE-003 — Submit a burn transaction

**Story:** Submit burn transaction  
**Priority:** P0  
**Level:** UI plus stub or integrated POC

**Given** `WAL-US-OPS-001` has `500.00 USDC` available  
**And** the `burn-success` outcome completes token burning and fiat release  
**When** `Alice Chen` submits `BURN-UI-001`  
**Then** the UI displays a *Transaction Reference* and successful *Transaction Status*  
**And** the source *Wallet* shows the reduced token balance when balance refresh is supported  
**And** the destination *Account* shows the fiat-release outcome when that information is exposed by the POC UI  

**Playwright assertions:** burn values; status/reference; wallet balance; fiat-release outcome if represented.

### 7.4 Wallet management

#### OPS-WAL-001 — Submit a new wallet request

**Story:** Open new wallet  
**Priority:** P0  
**Level:** UI plus stub or integrated POC

**Given** `Alice Chen` has wallet-management entitlement  
**When** the user submits a new wallet request with the required account, asset, and fiat-ledger linkage  
**Then** the UI displays the request status and wallet-request reference  
**And** the request is available for the configured approval flow  
**But** the UI does not show the wallet as active before wallet creation succeeds  

**Playwright assertions:** required fields; request status; no premature active wallet.

#### OPS-WAL-002 — Display wallet creation status

**Story:** Display wallet creation status  
**Priority:** P0  
**Level:** UI plus stub or integrated POC

**Given** a wallet-creation request has been submitted  
**When** the Fireblocks wallet-creation outcome changes to successful  
**Then** the UI displays the created *Wallet* and its status  
**And** associated account or fiat-ledger linkage is visible where supported  
**But** a failed wallet-creation outcome is not displayed as an active wallet  

**Playwright assertions:** status refresh; wallet identifier/details; failure state if stubbed.

#### OPS-WAL-003 — Submit an existing wallet modification

**Story:** Maintain existing wallet  
**Priority:** P1  
**Level:** UI plus stub or integrated POC

**Given** `WAL-CA-OPS-001` is an active wallet eligible for maintenance  
**When** `Alice Chen` submits a valid wallet-modification request  
**Then** the UI displays the request status  
**And** updated wallet details are visible after successful completion  
**But** an unsuccessful modification does not replace the last known valid wallet details  

**Playwright assertions:** modification form; status; updated detail or preserved detail on failure.

### 7.5 Transaction status, history, and export

#### OPS-HIST-001 — View transaction status by reference

**Story:** View transaction status and history  
**Priority:** P0  
**Level:** UI plus stub or integrated POC

**Given** `MINT-UI-001` has a known *Transaction Reference*  
**When** `Alice Chen` searches transaction status/history for the reference  
**Then** the matching transaction row is displayed  
**And** the row shows transaction type, amount, source, destination, and *Transaction Status*  
**And** displayed status matches the configured service outcome  

**Playwright assertions:** result count; domain fields and values; status.

#### OPS-HIST-002 — Filter transaction history

**Story:** Filter transaction history  
**Priority:** P1  
**Level:** UI plus stub or integrated POC

**Given** transaction history contains mint, transfer, and burn records  
**When** `Alice Chen` filters by wallet `WAL-CA-OPS-001`, status `successful`, amount range, network, or date  
**Then** each displayed row matches all active filter criteria  
**And** no row outside the active criteria is displayed  
**But** clearing filters restores the unfiltered transaction set  

**Playwright assertions:** filtered row values; no out-of-filter rows; clear-filter behavior.

#### OPS-HIST-003 — Display an unavailable transaction outcome

**Story:** Display transaction retrieval error  
**Priority:** P1  
**Level:** UI plus service stub

**Given** the transaction-history service returns `service-unavailable`  
**When** `Alice Chen` opens or refreshes transaction history  
**Then** the UI displays an operator-readable retrieval error and retry action  
**But** the UI does not present stale or partial rows as current results without an explicit stale-data indication  

**Playwright assertions:** error state; retry control; no misleading successful data state.

#### OPS-HIST-004 — Download filtered transactions

**Story:** Download filtered transactions  
**Priority:** P1  
**Level:** UI plus stub or integrated POC

**Given** transaction history is filtered to successful `USDC` transactions for `WAL-CA-OPS-001`  
**When** `Alice Chen` downloads filtered transactions  
**Then** the browser receives a document download  
**And** the downloaded document contains only the filtered transaction records and their transaction references  

**Playwright assertions:** download event; agreed file name/type; content includes expected records and excludes known non-matching records.

### 7.6 Operational visibility

#### OPS-OBS-001 — Display service health or unavailable state

**Story:** View system health  
**Priority:** P1  
**Level:** UI plus stub or integrated POC

**Given** the POC health endpoint reports healthy or unavailable  
**When** `Alice Chen` opens the operational health view  
**Then** the UI displays the health state for the relevant POC service  
**And** the state identifies the orchestration, core simulator, or digital-asset service  
**But** an unavailable service is not shown as healthy  

**Playwright assertions:** service name and health state; unavailable message; no false healthy state.

#### OPS-OBS-002 — Recover a processing transaction after delayed webhook

**Story:** Refresh processing transaction status  
**Priority:** P0  
**Level:** UI plus stub or integrated POC

**Given** `MINT-UI-001` has the `mint-webhook-delayed` outcome  
**When** `Alice Chen` views the transaction before the webhook arrives  
**Then** the UI displays a processing *Transaction Status* and the *Transaction Reference*  
**When** the successful webhook outcome becomes available and the user refreshes the transaction  
**Then** the UI displays the successful status  
**But** the UI does not create a second transaction for the refresh  

**Playwright assertions:** before/after status; stable reference; no duplicate history row.

## 8. Case Traceability

| POC story-map capability | Test cases |
| --- | --- |
| Login, landing page, role-based entitlement | `OPS-AUTH-001` to `OPS-AUTH-003` |
| Transaction initiation and account/wallet retrieval | `OPS-TXN-001` to `OPS-TXN-003` |
| Mint and status propagation | `OPS-TXN-004` to `OPS-TXN-009`, `OPS-OBS-002` |
| Transfer | `OPS-LIFE-001`, `OPS-LIFE-002` |
| Burn and fiat release | `OPS-LIFE-003` |
| Open and maintain wallets | `OPS-WAL-001` to `OPS-WAL-003` |
| Transaction status/history and filters | `OPS-HIST-001` to `OPS-HIST-004` |
| Error handling and monitoring | `OPS-HIST-003`, `OPS-OBS-001`, `OPS-OBS-002` |

## 9. Playwright Handoff Contract

Before implementing scripts, QA and development should agree the following values. These are intentionally not invented in this document:

| Contract item | Required decision |
| --- | --- |
| Application base URL and route map | Confirm login, landing, transaction, wallet, history, and health routes |
| Stable selectors | Add `data-testid` or accessible-name contract for navigation, forms, rows, status, and actions |
| Literal UI copy | Confirm exact error, success, pending, and access-denied messages |
| Authentication | Confirm seeded user login, token/session bootstrap, and logout/reset behavior |
| Fixture reset | Confirm how accounts, wallets, balances, transactions, and service outcomes reset per test |
| Service control | Confirm route stubs, simulator controls, or integrated test endpoints for each outcome fixture |
| Async polling | Confirm polling interval, timeout, and supported refresh mechanism |
| Download format | Confirm file type, name pattern, columns, encoding, and date/amount formatting |
| Accessibility contract | Confirm keyboard access, accessible names, roles, and focus behavior |
| Environment split | Mark each case `ui`, `stubbed`, or `integrated` in the QA repo |

## 10. Known Gaps and Assumptions

1. The POC story maps name capabilities and ownership but do not define final DASH routes, literal copy, selectors, or the complete approval model.
2. Current context describes MVP-1 as foundational tokenized deposits and MVP-2 as manually initiated internal money movement through DASH. This document treats the POC operator UI flows as testable POC scope; release placement must be confirmed before using these cases as MVP release gates.
3. Source material names account, wallet, fiat reserve, Fireblocks, webhook, and transaction status behavior, but does not provide a complete UI contract. Assertions are therefore phrased around domain-visible outcomes.
4. `1,000.00 USDC` is based on the worked mint example in the orchestration-engine overview. Other identifiers are synthetic fixtures.
5. If the current implementation behaves differently, record it as an observed characterization result and create a separate change case for the intended behavior; do not silently rewrite the expected result.

## 11. Exit Criteria for QA Handoff

The document is ready to translate into Playwright once every case has:

- an agreed route and stable selector contract;
- a deterministic fixture or integrated environment outcome;
- a confirmed expected literal message where copy is asserted;
- a defined reset strategy;
- an owner for unresolved gaps;
- a decision on whether the case is smoke, regression, integration, or negative coverage.
