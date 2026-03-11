// ─── Frameverse Service Worker ─────────────────────────────────────────────
// Handles push notifications and notification clicks.

// Push event — show a notification when a push message arrives
self.addEventListener("push", (event) => {
    if (!event.data) return;

    let payload;
    try {
        payload = event.data.json();
    } catch {
        payload = { title: "Frameverse", body: event.data.text() };
    }

    const { title, body, icon, url, tag } = payload;

    const options = {
        body: body || "",
        icon: icon || "/android-chrome-192x192.png",
        badge: "/android-chrome-192x192.png",
        tag: tag || "frameverse-notification",
        renotify: true,
        requireInteraction: tag?.startsWith("call-"), // Keep call notifications visible
        vibrate: tag?.startsWith("call-") ? [200, 100, 200, 100, 200] : [200, 100, 200],
        data: { url: url || "/" },
        actions: tag?.startsWith("call-")
            ? [
                { action: "answer", title: "Answer" },
                { action: "decline", title: "Decline" },
            ]
            : [],
    };

    event.waitUntil(self.registration.showNotification(title || "Frameverse", options));
});

// Notification click — focus or open the app
self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const urlToOpen = event.notification.data?.url || "/";
    const fullUrl = new URL(urlToOpen, self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            // If a window is already open, focus it
            for (const client of clientList) {
                if (client.url.startsWith(self.location.origin) && "focus" in client) {
                    client.focus();
                    if (urlToOpen !== "/") {
                        client.navigate(fullUrl);
                    }
                    return;
                }
            }
            // Otherwise open a new window
            return clients.openWindow(fullUrl);
        })
    );
});

// Activate immediately — skip waiting
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
});
