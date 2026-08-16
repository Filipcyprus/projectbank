# Integrations

What each integration would require, and what the prototype does today. Nothing here is connected in
this build; every row is the honest state of the work.

## Status of every port in this build

| Port | Demo adapter | Live adapter skeleton | Blocking requirement |
| --- | --- | --- | --- |
| Identity | Local credential, simulated assurance | `OidcIdentityAdapter` (OIDC + PKCE) | Accreditation with a national eID / eIDAS node or a licensed IDV vendor |
| Banking | Demo ledger | `OpenBankingAdapter` (PSD2 AISP) | AISP licence or a regulated aggregator, plus per-bank onboarding |
| Payments | Local ledger writes | `PspPaymentsAdapter` | PISP/EMI licence or a partner PSP; SCA enforced server-side |
| Government | Public service catalogue + simulated applications | `GovGatewayAdapter` | A data-sharing agreement per department, served through the Nisos gateway |
| Documents | On-device vault, real device-side signing (SHA-256 hash binding, not eIDAS QES) | `DocumentVerificationAdapter` / a QES trust service for legally binding signatures | A trust service for issuer verification and an accredited QES provider for signatures that count legally |
| Notifications | Local feed + real OS notifications while the tab is open (`src/lib/notify.ts`) | `PushNotificationsAdapter` | Push service keys, a server to hold subscriptions, and department feeds — needed only for delivery while the app is fully closed |
| Analytics | No-op (console in dev) | `HttpAnalyticsAdapter` | An endpoint; events only, never amounts or identifiers |

## Configuration

All keys are empty by default (`.env.example`). An adapter is only allowed to claim `official-api`
when its configuration is present at runtime:

```
VITE_IDP_ISSUER, VITE_IDP_CLIENT_ID, VITE_IDP_REDIRECT_URI, VITE_IDP_SCOPES
VITE_OPENBANKING_BASE_URL, VITE_OPENBANKING_CLIENT_ID, VITE_OPENBANKING_REDIRECT_URI
VITE_PSP_BASE_URL, VITE_PSP_PUBLISHABLE_KEY
VITE_GOV_GATEWAY_URL
VITE_DOCVERIFY_BASE_URL
VITE_PUSH_PUBLIC_KEY
VITE_ANALYTICS_ENDPOINT
```

`isPrototypeMode` is true when none of these is set, which is what drives the global demo banner.

## Authorisation model

- **User-present flows** (identity, bank consent) use OAuth 2.0 / OpenID Connect **authorization
  code with PKCE**. The citizen authenticates on the provider's own domain. Nisos never sees a bank
  password or an eID PIN.
- **Server-to-server flows** (department gateways) use mTLS from the Nisos gateway. Client secrets
  and certificates never exist in the client bundle.
- Access tokens are held **in memory only** and dropped on expiry. Refresh tokens live in an
  httpOnly, SameSite=Strict gateway session — the browser never reads them.
- Payments carry an `Idempotency-Key` so a retry cannot double-spend.
- Every outbound call goes through one wrapper with a 15-second timeout and typed error mapping
  (`auth_expired`, `consent_revoked`, `rate_limited`, `upstream_unavailable`, `network`), which is
  what lets the UI show a real error state with a retry rather than a spinner that never ends.

## Government services

The directory describes publicly known Cyprus services (Civil Registry and Migration, Tax
Department, Social Insurance Services, Department of Road Transport, Cyprus Police, Health Insurance
Organisation, Registrar of Companies, Department of Lands and Surveys, Ministry of Education,
municipalities). For each service Nisos records the department, description, required documents,
statutory fee, processing time and search keywords.

Integration reality per service:

- **`official-link`** — Nisos has no API. The service detail screen links to the government's own
  site and says so. This is the correct behaviour for most services today.
- **`coming-soon`** — the adapter exists and an application flow is designed, but no agreement is in
  place, so a submission is recorded locally and labelled as simulated.
- **`official-api`** — reserved. Setting it in the admin console raises a warning, and runtime still
  falls back to the demo adapter when `VITE_GOV_GATEWAY_URL` is unset.

Statutory fees always belong to the department. Nisos adds nothing on top of a government service.

## Open banking

The connection journey in the app is the real one: choose the bank → approve on the bank's own app
under strong customer authentication → the bank returns a scoped, read-only token → the consent
expires after 90 days and must be renewed. Because no licence is held, pressing **Connect** calls
`beginConsent()` and shows the genuine failure instead of a simulated success screen.

## Identity

A legally meaningful identity requires an accredited provider to perform document and liveness
checks and to issue an assurance level (substantial or high, in eIDAS terms). The prototype
simulates the journey and says so on every screen that touches it.

Selective disclosure is designed for the real end state: a W3C Verifiable Presentation with SD-JWT
selective disclosure, signed by a key in the device secure element, short-lived and revocable, so a
verifier can check it without contacting Nisos and without receiving a copy of an identity document.

## Data access log and consents

Security → **Data & consents** (`/security/data`) is a real, on-device record of what this citizen
actually did — every identity share created, government application submitted, bank connection
attempted, and document signed — not a mock timeline. It is populated by an `addDataAccessEvent`
dispatch alongside each of those real actions, and it's genuinely device-local: closing the tab
without exporting a sync code (`/profile/sync`) loses it. A production build keeps the same log
server-side, tied to the account, so it survives a reinstall and can answer "who accessed my data"
under GDPR Article 15 even after the device is gone. Active identity shares (`identityShares`) can
be revoked from the same screen, which is a real state change — revoked codes are rejected the
moment a verifier tries to use them, not just hidden from the list.

## Document signing

Vault documents can be "signed" from their detail sheet: a SHA-256 hash of the document's metadata
record is computed with the real Web Crypto API and bound to a timestamp and the confirming
biometric/PIN gate. Read literally: this proves the record wasn't altered on this device after that
moment. It does **not** produce a qualified electronic signature (QES) under eIDAS — that requires
an accredited trust service provider issuing a certificate to the signer's verified identity, which
this prototype has no relationship with. Every signed-document screen states this distinction rather
than letting "Signed" imply more than it does.

## Tax estimate calculator

`/gov/tax-estimate` runs Cyprus's public, statutory 2026 personal income tax bands (0% to €22,000;
20%/25%/30%/35% above that) against a number the citizen enters — pre-filled from their own recorded
income transactions, editable. This is real arithmetic on public tax law, not a fabricated
integration, but it excludes GHS/GESY contributions, Social Insurance, and any deduction, and it
never reaches the Tax Department. The screen says so and links to `tax.gov.cy` for an actual filing.

## Cyprus specifics

EUR throughout, SEPA rails for transfers, Cyprus IBAN formatting (masked in the prototype),
`el-CY` / `tr-CY` / `en-GB` formatting, and a directory built around Cyprus departments: road tax,
driving licence, MOT, vehicle registration and traffic fines; tax returns, payments and clearance
certificates; social insurance contributions and benefits; GHS/GESY beneficiary services;
company registration and employer services.
