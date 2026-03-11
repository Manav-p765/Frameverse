import { useEffect, useRef } from "react";
import api from "../services/api";

/**
 * Hook to register the service worker and subscribe to web push notifications.
 * Call this once in your App or after the user logs in.
 */
export default function usePushNotifications() {
    const subscribedRef = useRef(false);

    useEffect(() => {
        if (subscribedRef.current) return;
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
            console.log("[Push] Not supported in this browser.");
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) return; // Not logged in

        subscribedRef.current = true;

        (async () => {
            try {
                // 1. Register service worker
                const registration = await navigator.serviceWorker.register("/sw.js");
                console.log("[Push] Service Worker registered.");

                // 2. Request notification permission
                const permission = await Notification.requestPermission();
                if (permission !== "granted") {
                    console.log("[Push] Notification permission denied.");
                    return;
                }

                // 3. Get VAPID public key from server
                let vapidKey;
                try {
                    const res = await api.get("/push/vapid-key");
                    vapidKey = res.data.publicKey;
                } catch (err) {
                    console.warn("[Push] Could not fetch VAPID key — push disabled.", err.message);
                    return;
                }

                // 4. Subscribe to push
                const existingSub = await registration.pushManager.getSubscription();
                let subscription = existingSub;

                if (!subscription) {
                    const convertedKey = urlBase64ToUint8Array(vapidKey);
                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: convertedKey,
                    });
                    console.log("[Push] Subscribed to push notifications.");
                }

                // 5. Send subscription to backend
                await api.post("/push/subscribe", { subscription: subscription.toJSON() });
                console.log("[Push] Subscription saved to server.");
            } catch (err) {
                console.error("[Push] Setup error:", err);
            }
        })();
    }, []);
}

// Helper: Convert base64 VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
