'use strict';
const CACHE = 'synagogue-board-github-v2';
const ASSETS = ['./','./index.html','./admin.html','./styles.css','./admin.css','./config.js','./shared.js','./board.js','./admin.js','./manifest.json','./icon.svg'];
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.hostname.includes('hebcal.com') || url.hostname.includes('firebaseio.com') || url.hostname.includes('firebasedatabase.app')) return;
  event.respondWith(fetch(event.request).then(response => {
    const clone = response.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, clone));
    return response;
  }).catch(() => caches.match(event.request)));
});
