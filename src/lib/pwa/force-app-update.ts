/**
 * Fuerza una actualización limpia tras deploy (Vercel / PWA).
 * - Borra Cache Storage del Service Worker
 * - Desregistra SWs
 * - Recarga con cache-bust para evitar shell HTML viejo
 */
export async function forceAppUpdate(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch {
    // ignore — still attempt reload
  }

  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((reg) => reg.unregister()));
    }
  } catch {
    // ignore
  }

  const url = new URL(window.location.href);
  url.searchParams.set('_refresh', String(Date.now()));
  window.location.replace(url.toString());
}
