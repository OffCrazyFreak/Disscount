"use client";

import { useSyncExternalStore } from "react";

import {
  getAnnouncement,
  subscribeAnnouncer,
} from "@/app/(user)/digital-cards/utils/card-announcer";

interface ICardAnnouncerProps {
  /** Text announced alongside card changes, such as a search result count. */
  extra?: string;
}

// The list page and the open modal each render one: the modal hides the page from
// assistive tech, so only the region inside it is heard while it is open.
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
