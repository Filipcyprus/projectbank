# Installing Nisos as a mobile app

Open **http://192.168.10.16:5173** on your phone's browser while on the same Wi-Fi as this computer.

## Android (Chrome)

1. Open the link in Chrome
2. Tap the **⋮** menu (three dots, top-right)
3. Tap **"Install app"** or **"Add to Home Screen"**
4. Confirm — the app will download as an icon on your home screen
5. Tap the icon to open Nisos full-screen

## iOS (Safari)

1. Open the link in Safari
2. Tap the **Share** button (arrow up from bottom)
3. Scroll right and tap **"Add to Home Screen"**
4. Confirm — the app will download as an icon on your home screen
5. Tap the icon to open Nisos full-screen

## What you get

- **Full-screen app** — no browser address bar
- **Works offline** — the app shell caches on first load, so returning users work even if the Wi-Fi drops
- **Home screen access** — just like a native app
- **Same data** — your app and browser-tab versions share the same local data

## What stays simulated in this build

- **Biometric unlock** — face/touch ID still show a prompt but don't actually check your device. A real app uses the platform's native biometric APIs.
- **Push notifications** — only fire while the tab/app window is open (see [docs/MOBILE.md](docs/MOBILE.md) for why)
- **Updates** — the app won't auto-update to new versions. A real deployment has a server checking for new code.
