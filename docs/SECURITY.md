# Security and privacy

The product promise is "government-grade security with fintech simplicity". This document separates
what the prototype demonstrates from what a production deployment must actually do.

## In the prototype

- **Biometric or PIN confirmation wraps every sensitive action** — viewing or sharing the Digital
  ID, sending money, paying a bill, freezing the account, changing emergency access. It is one
  component (`BiometricGate`), so no screen can forget it.
- **PIN attempt lockout is enforced, not just displayed.** Five wrong entries lock the pad for 60
  seconds; the streak and lockout timestamp live in `SecuritySettings` (`src/state/store.tsx`,
  `usePinLockout`), so closing and reopening the sheet doesn't reset the count — the obvious way
  around a client-only lockout.
- **Auto-lock is enforced app-wide.** `autoLockMinutes` (Security → Sign-in) arms a real timer on
  every interaction and a backgrounding check on `visibilitychange`; either firing re-locks the app
  behind a full-screen `AppLockScreen` that only biometrics, PIN or explicit sign-out can dismiss.
- **Selective disclosure** for identity: claims are released individually, to one named audience,
  for five minutes, and can be revoked. The share screen counts how many fields stay private.
- **Freezing is enforced, not decorative.** `accountFrozen` and `cardFrozen` are checked
  (`src/lib/guard.ts`) before every payment execution and before creating an identity share code —
  toggling the switch actually blocks those flows with a real error state, not just a label.
- **Security centre** with a weighted score, device management and revocation, login history that
  shows a *blocked* sign-in rather than hiding it, per-transaction confirmation, card freeze,
  account freeze and emergency access.
- **Token discipline in the adapter layer**: in-memory access tokens with expiry, PKCE challenge
  generation from the platform CSPRNG, idempotency keys on payments, a single call wrapper with
  timeouts and typed errors.
- **A baseline Content-Security-Policy** ships in `index.html`, restricting script/style/connect
  sources to the app's own origin and Google Fonts. It's a floor, not the final word — see below.
- **An insecure origin is called out, not silently degraded.** If `window.isSecureContext` is
  false, the app says so on boot: WebAuthn, service workers and the install prompt all require
  HTTPS (or localhost) to exist at all.
- **Nothing leaves the device.** The demo adapters are local; the analytics adapter is a no-op.

## Required in production (not implemented here)

| Area | Requirement |
| --- | --- |
| Authentication | Passkeys / WebAuthn or platform biometrics; the private key stays in the secure element, the app only receives a signed assertion. This build's biometric prompt is a UI simulation. |
| PIN | Never stored in plain text; derived with a memory-hard KDF, server-side rate limiting too (this build's lockout is client-side state, which a determined attacker with local storage access can clear — real protection has to live behind the server that verifies the PIN) |
| CSP | The meta-tag policy in `index.html` can't set `frame-ancestors`, can't use CSP reporting, and keeps `'unsafe-eval'` for Vite's dev server. Production must serve an equal-or-stricter policy as a real HTTP header, without `'unsafe-eval'`, plus `X-Frame-Options`/`frame-ancestors`, `X-Content-Type-Options: nosniff`, and HSTS |
| Transport | TLS 1.3 everywhere, HSTS, certificate pinning on mobile, mTLS between gateway and departments |
| Documents | Envelope encryption: AES-256-GCM content key, wrapped by a device key; the server stores ciphertext only and cannot read a document |
| Secrets | Client secrets, certificates and refresh tokens live only in the gateway; nothing sensitive in the client bundle |
| Sessions | Short-lived access tokens, rotating refresh tokens in httpOnly SameSite=Strict cookies, server-side revocation reflected on every device immediately |
| Payments | Strong customer authentication enforced server-side, idempotency, velocity and anomaly checks, dual control on high-value operations |
| Audit | Append-only security event log with retention and export; every operator action attributable |
| Operations | Per-role access in the console, mandatory MFA for staff, key rotation on schedule, incident response and breach notification procedures |

## Privacy posture

- **Data minimisation by default.** The identity share screen releases claims, not documents:
  "over 18" instead of a birth date wherever a verifier only needs an age check.
- **Zero-knowledge storage.** The operator console shows document *metadata* only — name, issuer,
  size, expiry, verification state. It cannot show contents, by design.
- **Analytics without identifiers.** Event names and coarse properties only; never amounts, IBANs,
  identity numbers or document names.
- **Government data on explicit consent**, scoped per department, with a lawful basis recorded per
  processing activity, as GDPR and Cyprus data-protection law require.
- **Citizen rights** surfaced in Profile → Privacy: export, sharing history, deletion. These are
  screens in the prototype, not working endpoints, and say so.

## Threat model summary

| Threat | Mitigation |
| --- | --- |
| Device theft | Biometric/PIN gate on app open and on every sensitive action; remote device revocation; account freeze |
| Phishing for bank credentials | Nisos never asks for them; account access only ever via the bank's own authenticated flow |
| Malicious merchant QR | Merchant resolution through the acquirer before an amount is shown; amount signed by the terminal |
| Over-sharing of identity | Field-level disclosure, presets biased to the minimum, sensitive fields flagged, five-minute expiry |
| Server compromise | Documents are ciphertext; identity keys are on-device; tokens are scoped and short-lived |
| Insider access | Role-based console access, metadata-only visibility, append-only audit log |
| Session hijack | httpOnly cookies, SameSite=Strict, device binding, anomaly detection on sign-in geography |

## Regulatory position of this build

No banking licence, no e-money or payment institution licence, no AISP/PISP permission, no
government data-sharing agreement, no identity accreditation. The app states this in Profile →
Terms, and the operator console shows it as outstanding readiness rather than burying it.
