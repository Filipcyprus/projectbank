/* ---------------------------------------------------------------------------
 * Desktop / browser notifications.
 *
 * This is the real Notification API — a granted permission produces an
 * actual OS-level notification, not a styled toast pretending to be one.
 * The honest limit: it only fires while this tab (or an installed PWA
 * window) is open and running. Delivering a notification while the app is
 * fully closed needs the Push API plus a server holding subscriptions and a
 * VAPID key — neither exists in this prototype. See docs/INTEGRATIONS.md.
 * ------------------------------------------------------------------------- */

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export function getNotificationPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  try {
    return await Notification.requestPermission();
  } catch {
    return getNotificationPermission();
  }
}

/** Fires a real OS notification. Silently does nothing if not permitted. */
export function notifyBrowser(title: string, body: string, route?: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    const n = new Notification(title, { body, icon: '/icons/icon-192.png', badge: '/icons/icon-96.png' });
    if (route) {
      n.onclick = () => {
        window.focus();
        window.location.hash = `#${route}`;
        n.close();
      };
    }
  } catch {
    /* some browsers throw if called from a non-user-gesture context on certain platforms */
  }
}
