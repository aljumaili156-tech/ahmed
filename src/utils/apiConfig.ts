/**
 * Cloud Backend & Real-time Database Configuration
 * Seamlessly connects frontends (Cloud Run, Netlify, Vercel, local) to the live cloud database.
 */

const CLOUD_BACKEND_STORAGE_KEY = 'school_bell_cloud_backend_url';
export const DEFAULT_CLOUD_RUN_BACKEND = 'https://ais-pre-33o24pzapm4kb77wsengsi-968656368528.europe-west2.run.app';

export function getCloudBackendUrl(): string {
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(CLOUD_BACKEND_STORAGE_KEY);
      if (saved && saved.trim()) {
        return saved.trim().replace(/\/+$/, '');
      }
      
      const host = window.location.hostname;
      const isLocalOrCloudRun =
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host.includes('run.app') ||
        host.includes('google.com');

      // If hosted on external domain (Netlify, Vercel, GitHub Pages, cPanel, custom domain)
      if (!isLocalOrCloudRun) {
        return DEFAULT_CLOUD_RUN_BACKEND;
      }
    }
  } catch {}

  return ''; // Relative path for direct Cloud Run / local dev server
}

export function setCloudBackendUrl(url: string): void {
  try {
    if (typeof window !== 'undefined') {
      if (!url || !url.trim()) {
        localStorage.removeItem(CLOUD_BACKEND_STORAGE_KEY);
      } else {
        localStorage.setItem(CLOUD_BACKEND_STORAGE_KEY, url.trim().replace(/\/+$/, ''));
      }
    }
  } catch {}
}

export function apiUrl(endpoint: string): string {
  const base = getCloudBackendUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return base ? `${base}${cleanEndpoint}` : cleanEndpoint;
}
