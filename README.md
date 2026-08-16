# Nisos

**Everything Cyprus. One secure app.**

A working prototype of a Cyprus super-app: verified digital identity, government services,
personal finance, payments, a digital wallet and an encrypted document vault in one product —
plus an operator console for the platform team.

> ### This is a prototype, not a live service
>
> **No bank, payment provider, ministry or identity authority is connected to this build.**
> Every balance, transaction, credential and application in it is invented demo data generated on
> your device. Nothing leaves the browser.
>
> The product is designed so that this is impossible to miss: every account, service, document,
> notification and card carries a status badge — **Official API**, **Official website**,
> **Coming soon** or **Demo** — and that badge is derived at runtime from whether an integration is
> actually configured, not from a hand-written label.

---

## Run it

```bash
npm install
```

```bash
npm run dev
```

Then open <http://localhost:5173>.

- The citizen app opens at `#/home` (after a ten-step onboarding).
- The operator console is at `#/admin`.
- Prototype PIN: **1234**. Biometric prompts are simulated.
- Reset everything from **Profile → Prototype tools → Reset demo data**.

Other scripts: `npm run build`, `npm run preview`, `npm run typecheck`.

---

## What is in it

**Home** — greeting, Digital ID status, total balance with a spend trend, quick actions
(Send / Pay / Scan), government notifications, upcoming bills, expiring documents and recent
activity.

**Digital ID** — biometric-gated credential, QR presentation, simulated assurance check and
**selective disclosure**: the citizen ticks individual claims (name, over-18, identity-verified,
date of birth, …) and a five-minute, revocable share code is created for one named audience.
Nothing else is released.

**Government** — a searchable directory of ~42 Cyprus services across Personal, Tax, Social
Insurance, Vehicles, Healthcare, Business and Other. Each service shows its department, description,
required documents (cross-referenced against your vault), statutory fee, processing time and
integration status, with either an application flow or a link to the official site. Application
tracking with a timeline is included, and it says plainly that it is simulated.

**Money** — total balance, accounts (current, savings, card, investments), spending analytics with
donut/bar/sparkline charts, budgets, savings goals, bills with a full pay flow, transaction history
with categories, and an open-banking connection screen that **shows the real reason it cannot
connect** rather than faking success.

**Payments** — send money (recipient → amount → review → biometric → result), QR scan-to-pay,
request money, bill payment and government fees. Every payment passes through a biometric or PIN
confirmation.

**Wallet** — Digital ID, driving licence, vehicle and insurance documents, certificates, health,
payment cards, tickets and loyalty passes as designed cards, with View / Share / Verify / Add to
wallet.

**Document vault** — eight categories, upload, expiry reminders, verification status, and
per-document detail. Documents are described as encrypted on-device; the operator console can only
ever see metadata.

**Notifications** — one centre, four separated streams (Government, Money, Security, Documents),
with severities and deep links, plus an opt-in for real desktop/OS notifications while the app is
open (`src/lib/notify.ts`) — not a styled toast, an actual `Notification`.

**Security centre** — security score, biometrics, PIN, 2FA, per-transaction confirmation, alerts,
device management with revocation, login history including a *blocked* sign-in, and controls that
are actually enforced, not just switches:
- **Auto-lock** arms a real timer on inactivity and re-checks on backgrounding; either one drops a
  full-screen lock behind biometrics/PIN (`AppLockScreen`).
- **PIN lockout** — five wrong entries locks the pad for 60 seconds, tracked in persisted state so
  reopening the sheet doesn't reset the count.
- **Card/account freeze** is checked (`src/lib/guard.ts`) before every payment execution and before
  creating an identity share code — toggling it actually blocks those flows.
- **Device trust** — an unrecognised device stays "Not trusted" until approved behind a biometric/PIN
  gate; revocation ends its session immediately. This is a local record, not a push to that other
  device — there's no account server to carry the approval, and the screen says so.
- **Data & consents** (`/security/data`) — a real, on-device log of every identity share, government
  submission, bank connection attempt and document signature, populated as those actions actually
  happen. Active identity shares can be revoked from the same screen; revocation is a real state
  change, not a hidden row.

**Family sharing** — invite up to four people (Premium/Business), each shown as pending until a
simulated acceptance; add/remove is real local state, not a mock.

**Budget alerts** — spend is recomputed from real transactions every time one is added
(`computeBudgetSpend`), and crossing 90%/100% of a category's budget fires an in-app + desktop
notification once per crossing, not on every app boot.

**Cross-device sync** — a manual code (`/profile/sync`) that carries preferences, security toggles,
profile and family list to another device, honestly labelled as manual because there's no account
server to sync through continuously.

**Document vault upload** — a real file picker; only the file's name, size and type are ever read,
and a simulated verification step moves each upload from *pending* to *verified* or *needs-review*
a few seconds later, the way an issuer check would. Any document can be **signed** on-device (a real
SHA-256 hash bound to a timestamp and a biometric/PIN confirm) — honestly labelled as proof the
record wasn't altered locally, not a qualified electronic signature (eIDAS QES).

**Tax estimate calculator** (`/gov/tax-estimate`) — real arithmetic against Cyprus's public 2026
income tax bands, pre-filled from the citizen's own recorded income and editable. Illustrative only:
excludes GHS/GESY and Social Insurance, and never reaches the Tax Department.

**Receipt sharing** — the real Web Share API (clipboard fallback) on every payment result and
request, not a "not implemented" toast.

**Installable app** — a manifest, icons and a service worker (`public/sw.js`) make this a real PWA:
add it to a phone's home screen and it opens full-screen and survives a dropped connection. See
[docs/MOBILE.md](docs/MOBILE.md) for exactly where that stops being equivalent to a native app.

**Profile** — personal information, identity, security, connected banks and government services,
documents, notifications, privacy, language, sync, family, appearance (light/dark/system, hide
balances, larger text), support, terms, plans and logout.

**Onboarding** — ten steps, each labelled **Demo step** or **Requires integration**.

**Operator console** (`#/admin`) — overview with KPIs and platform readiness, users, identity
verification queue, government services (with editable integration status and official links),
banks and providers, transactions, documents (metadata only), notifications, security events and
support tickets.

---

## Architecture in one paragraph

Screens never call a bank or a ministry. They call a **port** (`IdentityPort`, `BankingPort`,
`PaymentsPort`, `GovernmentPort`, `DocumentsPort`, `NotificationsPort`, `AnalyticsPort`). A
**registry** decides which **adapter** fulfils each port: a live adapter when configuration is
present, otherwise a demo adapter. Every adapter carries a descriptor with an honest
`IntegrationStatus`, and the UI renders that status. Connecting a real integration later is a
configuration change plus one registry line — no screen is rewritten.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/INTEGRATIONS.md](docs/INTEGRATIONS.md),
[docs/SECURITY.md](docs/SECURITY.md), [docs/MOBILE.md](docs/MOBILE.md) and
[docs/BUSINESS-MODEL.md](docs/BUSINESS-MODEL.md).

```
src/
  integrations/       ports, registry, config, live adapter skeletons, demo adapters
  state/              app store (reducer + context), local persistence
  i18n/               English / Greek / Turkish strings, direction metadata
  components/         icons, UI primitives, charts, auth surfaces (biometrics, PIN, QR)
  screens/            home, money, government, wallet, documents, identity,
                      payments, notifications, security, profile, onboarding
  admin/              operator console
  data/seed.ts        all demo data, clearly marked as invented
  styles/             design tokens, base layout, component styles
```

---

## Design

An original identity, deliberately unlike any existing bank or government product. Cyprus is the
copper island (*Kypros* ≈ *cuprum*), so the palette pairs an oxidised-copper accent with deep
Mediterranean ink and warm limestone neutrals. Minimal surfaces, generous whitespace, rounded
cards, restrained shadows, tabular figures for money, and motion that is short and purposeful.

- Full **light and dark** themes, driven by design tokens (no hard-coded colours in components).
- **English, Greek, Turkish**, with per-key fallback to English.
- Written entirely with **logical CSS properties**, so an RTL locale needs no layout work —
  Profile → Language has an RTL preview switch that mirrors the whole app to prove it.
- Every state is designed: loading skeletons, empty states, error states with retry, success
  states, and confirmation flows.
- No UI or chart libraries. React plus hand-written SVG.

---

## What is deliberately *not* faked

- Pressing **Connect a bank** calls the real port and surfaces the genuine failure: account access
  needs a licensed open-banking provider.
- Services with no API do not get a fake application flow — they hand you to the official website.
- The QR graphics are stated as non-scannable illustrations, not real encoded credentials.
- "Official API" is a claim the admin console warns about before it can be set, and the runtime
  still falls back to the demo adapter when no gateway is configured.
- Nisos charges nothing for government services in any plan.

Nisos is an independent prototype. It is not affiliated with, endorsed by, or connected to the
Republic of Cyprus, any government department, or any bank.
