"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const arr = new Uint8Array([...rawData].map((c) => c.charCodeAt(0)));
  return arr.buffer;
}

type State = "unsupported" | "loading" | "denied" | "subscribed" | "unsubscribed";

export function PushNotificationToggle() {
  const [state, setState] = useState<State>("loading");

  const checkStatus = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }
    const perm = Notification.permission;
    if (perm === "denied") { setState("denied"); return; }

    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    setState(sub ? "subscribed" : "unsubscribed");
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Listen for messages from SW to play notification sound
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "PLAY_NOTIFICATION_SOUND") {
        const audio = new Audio("/sounds/notification.wav");
        audio.volume = 0.7;
        audio.play().catch(() => {/* autoplay blocked — user must interact first */});
      }
    };
    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, []);

  const subscribe = async () => {
    setState("loading");
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setState("denied"); return; }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const json = sub.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });

      setState("subscribed");
    } catch (err) {
      console.error("Push subscribe failed:", err);
      setState("unsubscribed");
    }
  };

  const unsubscribe = async () => {
    setState("loading");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("unsubscribed");
    } catch (err) {
      console.error("Push unsubscribe failed:", err);
      setState("subscribed");
    }
  };

  if (state === "unsupported") return null;

  if (state === "denied") {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
        <BellOff className="w-3.5 h-3.5 flex-shrink-0" />
        <span>Notifications blocked — allow in browser settings</span>
      </div>
    );
  }

  if (state === "loading") {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-accent text-xs text-muted-foreground">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>...</span>
      </div>
    );
  }

  if (state === "subscribed") {
    return (
      <button
        onClick={unsubscribe}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gold-500/10 border border-gold-500/30 text-xs text-gold-400 hover:bg-gold-500/20 transition-colors"
        title="Click to turn off push notifications"
      >
        <Bell className="w-3.5 h-3.5" />
        <span>Alerts ON</span>
      </button>
    );
  }

  return (
    <button
      onClick={subscribe}
      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-accent border border-border text-xs text-muted-foreground hover:text-foreground hover:border-gold-500/30 transition-colors"
      title="Enable push notifications for new bookings and alerts"
    >
      <BellOff className="w-3.5 h-3.5" />
      <span>Enable Alerts</span>
    </button>
  );
}
