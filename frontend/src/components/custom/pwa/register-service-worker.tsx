"use client";

import { useEffect } from "react";

// Registers the service worker. A registered worker with a fetch handler is
// what makes the browser offer installation. Stage 2 (Serwist) replaces the
// worker with one that adds real offline caching.
export default function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("Service worker registration failed", error);
    });
  }, []);

  return null;
}
