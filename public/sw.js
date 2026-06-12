// ============================================================
// Chakwal Grand — Service Worker
// Handles background push notifications
// ============================================================

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Chakwal Grand", body: event.data.text() };
  }

  const { title = "Chakwal Grand", body = "", icon, badge, tag, data } = payload;

  const options = {
    body,
    icon: icon || "/icons/icon-192x192.png",
    badge: badge || "/icons/badge-72x72.png",
    tag: tag || "cg-notification",
    renotify: true,
    requireInteraction: true,
    data: data || {},
    actions: [
      { action: "open",    title: "Open Dashboard" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
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

// Notify open dashboard tabs to play sound
self.addEventListener("push", (event) => {
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("/dashboard")) {
          client.postMessage({ type: "PLAY_NOTIFICATION_SOUND" });
        }
      }
    })
  );
});

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(clients.claim()));
