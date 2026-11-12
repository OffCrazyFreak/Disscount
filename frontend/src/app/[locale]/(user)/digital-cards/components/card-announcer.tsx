"use client";

import { useSyncExternalStore } from "react";

import {
  getAnnouncement,
  subscribeAnnouncer,
} from "@/app/[locale]/(user)/digital-cards/utils/card-announcer";

// The list page and open modal each render one, because the modal hides the page from assistive tech.
export default function CardAnnouncer() {
  const announcement = useSyncExternalStore(
    subscribeAnnouncer,
    getAnnouncement,
    () => "",
  );

  return (
    <p role="status" aria-live="polite" className="sr-only">
      {announcement}
    </p>
  );
}
