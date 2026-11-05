"use client";

import { useSyncExternalStore } from "react";

import {
  getAnnouncement,
  subscribeAnnouncer,
} from "@/app/[locale]/(user)/digital-cards/utils/card-announcer";

interface ICardAnnouncerProps {
  extra?: string;
}

// The list page and open modal each render one, because the modal hides the page from assistive tech.
export default function CardAnnouncer({ extra = "" }: ICardAnnouncerProps) {
  const announcement = useSyncExternalStore(
    subscribeAnnouncer,
    getAnnouncement,
    () => "",
  );

  return (
    <p role="status" aria-live="polite" className="sr-only">
      {announcement || extra}
    </p>
  );
}
