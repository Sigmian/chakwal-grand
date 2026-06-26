// ============================================================
// Chakwal Guest House — Service Worker
// Handles background push notifications
// ============================================================

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Chakwal Guest House", body: event.data.text() };
  }

  const { title = "Chakwal Guest House", body = "", icon, tag, data } = payload;

  const showNotification = self.registration.showNotification(title, {
    body,
    icon: icon || "/images/logo.png",
    tag: tag || "cg-notification",
    renotify: true,
    requireInteraction: true,
    data: data || {},
    actions: [
      { action: "open",    title: "Open Dashboard" },
      { action: "dismiss", title: "Dismiss" },
    ],
  });

  // Also notify open dashboard tabs so they can play a sound
  const notifyClients = clients
    .matchAll({ type: "window" })
    .then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("/dashboard")) {
          client.postMessage({ type: "PLAY_NOTIFICATION_SOUND" });
        }
      }
    });

  event.waitUntil(Promise.all([showNotification, notifyClients]));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const url = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("/dashboard") && "focus" in client) {
          client.postMessage({ type: "PUSH_NOTIFICATION_CLICK", url });
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(clients.claim()));
