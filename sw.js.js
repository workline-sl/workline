/* =====================================================================
   WORKLINE service worker
   • lets the phone install Workline as an app (home-screen icon)
   • opens fast and still shows the app when the network is weak
   • shows phone notifications (Web Push) when they are switched on
   Privacy: ONLY the app's own files are cached. Database answers,
   photos, chats and personal data are never stored here.
   ===================================================================== */
const VER = 'wl-2026-10-10';
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
    icon: 'app-icon-192.png', badge: 'favicon.png', tag: d.tag || 'wl', renotify: true,
    data: { url: typeof d.url === 'string' && d.url.startsWith(self.registration.scope) ? d.url : self.registration.scope + '?nt=1' }
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || self.registration.scope;
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of all) { if (w.url.startsWith(self.registration.scope) && !/workline-admin/i.test(w.url) && 'focus' in w) { try { await w.navigate(url); } catch (err) { } return w.focus(); } }
    return self.clients.openWindow(url);
  })());
});
