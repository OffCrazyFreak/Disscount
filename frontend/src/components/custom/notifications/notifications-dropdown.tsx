"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BellRingIcon from "@/components/icons/bell-ring-icon";
import { useNotifications } from "@/context/notifications-context";
import NotificationSummary from "@/components/custom/notifications/components/notification-summary";
import NotificationsList from "@/components/custom/notifications/components/notifications-list";

interface INotificationsDropdownProps {
  /**
   * Answer open requests from external UI (e.g. the landing CTA). Only ONE
   * mounted dropdown should opt in, otherwise they all open together.
   */
  openViaContext?: boolean;
}

export default function NotificationsDropdown({
  openViaContext = false,
}: INotificationsDropdownProps) {
  const {
    notifications,
    summary,
    isLoading,
    hasNotifications,
    hasWatchlistItems,
    openMenuSignal,
  } = useNotifications();
  const router = useRouter();

  const [isOpen, setOpen] = useState(false);

  // Seeded with the current signal so a remount replays nothing: only a bump
  // that happens while this instance is mounted counts as a real request.
  const lastHandledSignal = useRef(openMenuSignal);

  useEffect(() => {
    if (!openViaContext || openMenuSignal === lastHandledSignal.current) return;

    lastHandledSignal.current = openMenuSignal;
    setOpen(true);
  }, [openViaContext, openMenuSignal]);

  function handleAddProducts() {
    setOpen(false);

    router.push("/watchlist");
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={
            hasNotifications
              ? `Obavijesti (${notifications.length})`
              : "Obavijesti"
          }
        >
          <BellRingIcon aria-hidden="true" />

          {hasNotifications && (
            <Badge size="count" className="absolute -top-0.5 -right-1">
              {notifications.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="max-w-screen sm:max-w-xs">
        {/* Summary section */}
        {hasNotifications && <NotificationSummary summary={summary} />}

        <NotificationsList
          notifications={notifications}
          isLoading={isLoading}
          hasWatchlistItems={hasWatchlistItems}
          onSelect={() => setOpen(false)}
          onAddProducts={handleAddProducts}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
