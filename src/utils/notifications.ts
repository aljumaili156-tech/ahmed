/**
 * Web Notifications, Mobile Haptic Vibration & Screen WakeLock Utilities
 * Optimized for Lock Screen and Background Alerts
 */

export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export function getNotificationStatus(): NotificationPermissionStatus {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  try {
    const result = await Notification.requestPermission();
    return result === 'granted';
  } catch (err) {
    console.warn('Failed to request notification permission:', err);
    return false;
  }
}

export function triggerVibration(pattern: number[] = [600, 250, 600, 250, 1000, 300, 1000]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // ignore
    }
  }
}

export function sendClassAlertNotification(title: string, body: string): boolean {
  triggerVibration([600, 250, 600, 250, 1000, 300, 1000]);

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    // 1. Service Worker Notification (Most powerful for Mobile Lock Screen & Background)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        try {
          (reg as any).showNotification(title, {
            body,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            tag: 'class-bell-alert',
            renotify: true,
            requireInteraction: true,
            vibrate: [600, 250, 600, 250, 1000, 300, 1000],
            silent: false,
            data: { url: '/' },
            actions: [
              {
                action: 'dismiss_heading',
                title: '✅ توجهت للدرس (إلغاء الجرس)',
              },
            ],
          });
        } catch (swErr) {
          console.warn('Service worker showNotification fallback:', swErr);
          createStandardNotification(title, body);
        }
      }).catch(() => {
        createStandardNotification(title, body);
      });
      return true;
    }

    return createStandardNotification(title, body);
  }
  return false;
}

function createStandardNotification(title: string, body: string): boolean {
  try {
    const n = new Notification(title, {
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: 'class-bell-alert-' + Date.now(),
      requireInteraction: true,
      silent: false,
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
    return true;
  } catch (e) {
    console.warn('Standard notification error:', e);
    return false;
  }
}

// Screen Wake Lock API to prevent phone display sleeping during classroom shifts
let wakeLockSentinel: any = null;

export async function requestWakeLock(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
    try {
      wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      wakeLockSentinel.addEventListener('release', () => {
        wakeLockSentinel = null;
      });
      return true;
    } catch (err) {
      console.warn('Wake Lock request error:', err);
      return false;
    }
  }
  return false;
}

export function releaseWakeLock() {
  if (wakeLockSentinel) {
    try {
      wakeLockSentinel.release();
    } catch {
      // ignore
    }
    wakeLockSentinel = null;
  }
}
