# Architecture

## The rule the whole codebase is organised around

> A screen may never know which bank, ministry or payment scheme is behind the data it renders,
> and the app may never present demo data as if it were real.

Everything below follows from that.

## Layers

```
┌───────────────────────────────────────────────────────────────┐
│ Screens (React)                                               │
│  render domain models + descriptor.status. No fetch calls.    │
├───────────────────────────────────────────────────────────────┤
│ Store (reducer + context)                                     │
│  loads through ports, holds per-scope load/error state         │
├───────────────────────────────────────────────────────────────┤
│ Registry            src/integrations/registry.ts              │
│  picks live adapter when configured, demo adapter otherwise    │
├───────────────────────────────────────────────────────────────┤
│ Ports               src/integrations/types.ts                 │
│  IdentityPort · BankingPort · PaymentsPort · GovernmentPort   │
│  DocumentsPort · NotificationsPort · AnalyticsPort            │
├──────────────────────────────┬────────────────────────────────┤
│ Live adapters (skeletons)    │ Demo adapters                  │
│  OIDC / PSD2 / PSP / gateway │  local data + latency + errors │
└──────────────────────────────┴────────────────────────────────┘
                 │                              
                 ▼                              
      Nisos gateway (server, not in this repo)  
       holds secrets, mTLS, refresh tokens,     
       per-department connectors                
```

### Ports

A port is a TypeScript interface plus a `ProviderDescriptor`:

```ts
interface ProviderDescriptor {
  id: string;
  kind: ProviderKind;
  name: string;            // the counterparty
  operator: string;        // who runs the endpoint
  status: IntegrationStatus;
  auth: AuthMethod;        // none | demo | oidc | oauth2 | gateway-mtls
  capabilities: string[];  // feature detection, e.g. 'accounts.read'
  website?: string;        // always available fallback for the citizen
  apiBaseUrl?: string;     // only when status === 'official-api'
  note?: string;           // why it is not live yet (shown in the console)
  lawfulBasis?: string;    // for the register of processing activities
}
```

`IntegrationStatus` is the product-facing truth value:

| Status | Meaning | Where it comes from |
| --- | --- | --- |
| `official-api` | A signed agreement and live credentials exist; real calls happen | Only when config is present at runtime |
| `official-link` | No API; the citizen is handed to the official website | Service catalogue |
| `coming-soon` | Adapter written, agreement or licence outstanding | Service catalogue / registry |
| `demo` | Simulated data, never leaves the device | Demo adapters |

### The honesty mechanism

`src/integrations/config.ts` reads configuration at runtime and computes `isLive.*` per kind. The
registry only instantiates a live adapter when the corresponding configuration exists; otherwise the
demo adapter is used and reports `status: 'demo'`. A live adapter with missing configuration throws
`NotConfiguredError` rather than returning plausible-looking data.

Because `<StatusBadge status={…} />` renders the descriptor's own status, a mislabelled integration
is a visible product bug, not a cosmetic one. The admin console warns before a service can be marked
`official-api`, and notes that runtime will still fall back to demo when no gateway is configured.

### Adding a real integration

1. Sign the agreement / obtain the licence.
2. Implement or complete the adapter in `src/integrations/adapters/liveAdapters.ts` against the
   gateway route (never against a ministry or bank endpoint from the client).
3. Set the environment variables in `.env` (see `.env.example`).
4. Nothing else. The registry switches, the badges change, no screen is touched.

## State

`src/state/store.tsx` is a reducer plus context.

- Domain data is always loaded via `registry.ports.*`, never imported from `data/seed.ts` by a
  screen. Per-scope `load` (`idle | loading | ready | error`) and `errors` drive the skeleton,
  error and retry states.
- Only preferences, security settings and records created on this device (`tx_local_*`,
  `doc_local_*`, `p_local_*`, `app_local_*`, paid bills, read notifications) are persisted, in
  `localStorage` under `nisos.state.v1`. In a real client this slice belongs in the platform
  keystore.
- Derived values (`totalBalance`, `unreadCount`, `securityScore`) are selectors, not stored state.

## Routing

A dependency-free hash router (`src/lib/router.ts`) with `match('/gov/service/:id', path)`. Hash
routing keeps the prototype deployable as static files and makes every screen deep-linkable,
including each admin section.

Notable routes: `/home`, `/money`, `/money/analytics|bills|goals|connect`, `/money/account/:id`,
`/gov`, `/gov/category/:cat`, `/gov/service/:id`, `/gov/applications`, `/wallet`,
`/wallet/card/:id`, `/vault`, `/id`, `/id/share`, `/pay`, `/pay/send`, `/pay/scan`, `/pay/request`,
`/notifications`, `/security`, `/security/devices|logins`, `/profile/*`, `/admin/:section`.

## Internationalisation and direction

`src/i18n/strings.ts` holds English as the source of truth (`StringKey` is derived from it) and
partial Greek and Turkish dictionaries with per-key fallback. Locale metadata carries `dir` and an
Intl locale for number, currency and date formatting (`en-GB`, `el-CY`, `tr-CY`; EUR throughout).

The interface uses logical CSS properties (`margin-inline`, `inset-inline-start`, `text-align:
start`) everywhere, so direction is a data property rather than a layout rewrite. The RTL preview
switch in Profile → Language flips `document.documentElement.dir` to exercise it.

## Rendering and styling

- React 18 + Vite + TypeScript (strict). No routing, state, UI, icon or chart libraries.
- Three stylesheets: `tokens.css` (the only place colours are defined), `base.css` (shell, device
  frame, animations), `components.css` (component classes).
- Theme is `data-theme` on the root element; `system` follows `prefers-color-scheme` live.
- Icons and charts are hand-drawn SVG so they inherit `currentColor` and theme tokens.
- `prefers-reduced-motion` disables animation, and the count-up hook respects it.

## Operator console

`/admin` is a separate surface rendered outside the phone frame: overview, users, verification
queue, service configuration, institutions, transactions, document metadata, notification delivery,
security events and support tickets. It configures *which adapter and link a service uses* — it
never displays a citizen's credentials, and it cannot read documents, because they are encrypted
with a device key.
