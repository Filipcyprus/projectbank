/* ---------------------------------------------------------------------------
 * Installable app (PWA) support.
 *
 * This is what "mobile app" honestly means for a project built with a web
 * stack and no native tooling in this environment: a service worker for
 * instant, offline-tolerant loads, and the browser's own install flow so the
 * icon sits on a phone's home screen and the app opens without browser
 * chrome. It is not a native iOS/Android binary — see docs/MOBILE.md for
 * what that step would additionally require (Capacitor/React Native wrapper,
 * app-store accounts, native push, biometric APIs).
 * ------------------------------------------------------------------------- */

import { useEffect, useState } from 'react';

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  // Only in production: Vite's dev server serves unbundled modules that a
  // caching service worker would fight with during development.
  if (!import.meta.env.PROD) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* offline support degrades gracefully — the app still works online */
    });
  });
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const mq = window.matchMedia?.('(display-mode: standalone)').matches;
  // iOS Safari has no display-mode media query; it exposes this instead.
  const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  return Boolean(mq || iosStandalone);
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Captures the browser's install prompt so a normal button can trigger it. */
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone());

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!deferred) return 'unavailable';
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    return outcome;
  };

  return { available: !!deferred && !installed, installed, promptInstall };
}
