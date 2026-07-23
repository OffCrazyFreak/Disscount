"use client";

import { useEffect } from "react";

// Keeps the IndexedDB React Query cache from being evicted under storage pressure
// or disuse. Best-effort and silent: the granting policy varies by browser, notably iOS.
export default function RequestPersistentStorage() {
  useEffect(() => {
    if (!navigator.storage?.persist || !navigator.storage.persisted) return;

    navigator.storage
      .persisted()
      .then((isPersisted) => {
        if (!isPersisted) return navigator.storage.persist();
      })
      .catch(() => {
        // Persistence is an optimization, not a requirement - ignore failures.
      });
  }, []);

  return null;
}
