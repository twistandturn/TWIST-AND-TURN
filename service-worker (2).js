// Twist & Turn — Service Worker
// Caches the app shell so the site opens (with cached content) even offline,
// while always trying the network first so live data (results, FAQ, etc.) stays fresh.
// Also handles background push notifications via Firebase Cloud Messaging.

importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

// Must match firebase-config.js — service workers can't use ES module imports,
// so the same config values are duplicated here.
firebase.initializeApp({
  apiKey: "AIzaSyAmgZw3YeTDZSfrpwsULUAq6SnmtFQ1qTE",
  authDomain: "twistnturn-9623d.firebaseapp.com",
  projectId: "twistnturn-9623d",
  storageBucket: "twistnturn-9623d.firebasestorage.app",
  messagingSenderId: "802786554775",
  appId: "1:802786554775:web:9d2fe8b157513b0d5bcad2"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "Twist & Turn";
  const options = {
    body: payload.notification?.body || "",
    icon: "icon-192.png",
    badge: "icon-192.png"
  };
  self.registration.showNotification(title, options);
});

const CACHE_NAME = "tt-cache-v1";
const APP_SHELL = [
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./script.js",
  "./firebase-config.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle GET requests for our own origin — let Firestore/Google APIs pass straight through.
  if (req.method !== "GET" || !req.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match("./index.html")))
  );
});
