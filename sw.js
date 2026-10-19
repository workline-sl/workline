/* =====================================================================
   WORKLINE service worker
   • lets the phone install Workline as an app (home-screen icon)
   • opens fast and still shows the app when the network is weak
   • shows phone notifications (Web Push) when they are switched on
   Privacy: ONLY the app's own files are cached. Database answers,
   photos, chats and personal data are never stored here.
   ===================================================================== */
const VER = 'wl-2026-10-19';
const ICON = 'data:image/png;base64,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';   /* the Workline icon, inside this file */
const SHELL = ['./', './index.html', './manifest.webmanifest', './app-icon-192.png', './app-icon-512.png', './app-icon-maskable.png', './logo-mark.png', './favicon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VER).then(c => Promise.all(SHELL.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => { })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('wl-') && k !== VER).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const isShell = u => u.origin === self.location.origin && !/workline-admin/i.test(u.pathname) && !/sw\.js$/.test(u.pathname);
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (!isShell(u)) return;                       // database, fonts, CDN, admin panel: straight to the network
  if (req.mode === 'navigate') {                 // the page: newest version first, saved copy if offline / very slow
    const scopePath = new URL(self.registration.scope).pathname;
    const isApp = u.pathname === scopePath || u.pathname === scopePath + 'index.html';
    const save = r => { if (isApp && r && r.ok && r.type === 'basic' && !r.redirected && /text\/html/i.test(r.headers.get('content-type') || '')) return caches.open(VER).then(c => c.put('./index.html', r.clone())).catch(() => { }); };
    const net = fetch(req, { cache: 'no-cache' });
    e.waitUntil(net.then(save).catch(() => { }));      // even a late answer refreshes the saved copy
    e.respondWith((async () => {
      try {
        return await Promise.race([net.then(r => r.clone()), new Promise((_, rej) => setTimeout(() => rej(new Error('slow')), isApp ? 8000 : 30000))]);
      } catch (err) {
        if (!isApp) return fetch(req);
        const c = await caches.open(VER);
        return (await c.match('./index.html')) || net;
      }
    })());
    return;
  }
  e.respondWith((async () => {                    // icons / manifest: saved copy at once, refreshed in the background
    const c = await caches.open(VER), hit = await c.match(req);
    const net = fetch(req).then(r => { if (r && r.ok && r.type === 'basic') c.put(req, r.clone()).catch(() => { }); return r; }).catch(() => hit);
    return hit || net;
  })());
});

/* ---------- phone notifications ---------- */
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { title: 'WORKLINE', body: e.data ? e.data.text() : '' }; }
  const title = String(d.title || 'WORKLINE').slice(0, 80);
  e.waitUntil(self.registration.showNotification(title, {
    body: String(d.body || '').slice(0, 240),
    icon: ICON, tag: d.tag || 'wl', renotify: true, silent: false,
    requireInteraction: d.sticky === true,                       /* urgent "I need someone" requests stay until tapped */
    vibrate: d.sticky === true ? [200, 80, 200, 80, 200, 80, 400] : [120, 60, 120, 60, 200],
    data: { url: typeof d.url === 'string' && d.url.startsWith(self.registration.scope) ? d.url : self.registration.scope + '?nt=1' }
  }).then(syncBadge));
});
/* the red number on the home-screen icon = notices still waiting in the phone's notification list
   (the open app sets the exact unread count itself) */
async function syncBadge() {
  try {
    if (!self.navigator || !('setAppBadge' in self.navigator)) return;
    const n = (await self.registration.getNotifications()).length;
    await (n ? self.navigator.setAppBadge(Math.min(n, 99)) : self.navigator.clearAppBadge());
  } catch (err) { }
}
self.addEventListener('notificationclose', e => { e.waitUntil(syncBadge()); });
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || self.registration.scope;
  e.waitUntil((async () => {
    await syncBadge();
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of all) { if (w.url.startsWith(self.registration.scope) && !/workline-admin/i.test(w.url) && 'focus' in w) { try { await w.navigate(url); } catch (err) { } return w.focus(); } }
    return self.clients.openWindow(url);
  })());
});
