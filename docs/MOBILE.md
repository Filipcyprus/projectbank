# Mobile app

## What "mobile app" means in this build

Nisos is a responsive web app that installs like a native one: a manifest, a
service worker, and real icons — see [`public/manifest.webmanifest`](../public/manifest.webmanifest)
and [`public/sw.js`](../public/sw.js), wired up in [`src/lib/pwa.ts`](../src/lib/pwa.ts).
On a phone, "Add to Home Screen" (Android/Chrome) or "Add to Dock"/"Share → Add
to Home Screen" (iOS/Safari) puts a real icon on the home screen that opens
full-screen, no browser chrome, and keeps working with a flaky signal because
the app shell is cached.

That is a genuinely different, better experience than visiting the site — and
it is honestly not the same thing as a native binary from an app store. Both
matter to be clear about:

| | This build (PWA) | A native app |
| --- | --- | --- |
| Install | Browser's "Add to Home Screen", instant, no store review | App Store / Play Store, review process, signing certificates |
| Distribution | A URL | Store listing, developer account fees |
| Push notifications | Only while the app is open in a tab/window (`src/lib/notify.ts`) | Works with the app fully closed, via APNs/FCM |
| Biometrics | Simulated in this prototype; a real build would use WebAuthn, which most banking-grade flows still don't fully trust on web | Native Face ID / fingerprint APIs, the actual expectation for this product |
| Background processing | None (service workers can't run arbitrary background code) | Background app refresh, geofencing, etc. |
| Deep OS integration | Limited (share target, shortcuts) | Widgets, Siri/Assistant actions, wallet integration |

## Why this build stopped at PWA

There is no native mobile tooling available in this environment — no Xcode,
no Android SDK, no device or simulator to test against. Claiming a native
build without any way to compile or run one would be exactly the kind of
unverified claim this project's own rule (no faked integrations) exists to
prevent.

## What moving to native would actually take

1. **Wrap or rewrite.** Either wrap this React app in Capacitor (fastest —
   reuses this codebase in a native WebView shell with real plugin access to
   biometrics, push, contacts) or rewrite the UI in React Native/Flutter for
   fully native rendering. Capacitor is the pragmatic choice for a fintech
   prototype at this stage.
2. **Native biometrics.** Face ID/Touch ID on iOS, BiometricPrompt on
   Android — real secure-element-backed checks, replacing `BiometricGate`'s
   simulation with an actual platform call.
3. **Real push.** APNs (Apple) and FCM (Android/web) credentials, a server to
   hold device tokens and send pushes — this is also what real desktop push
   needs, see `docs/INTEGRATIONS.md`.
4. **App-store accounts and review.** Apple Developer Program, Google Play
   Console, app review (identity/finance apps get extra scrutiny), ongoing
   compliance with each store's financial-app policies.
5. **Device security posture.** Jailbreak/root detection, certificate
   pinning, secure storage (Keychain/Keystore) for anything sensitive.
