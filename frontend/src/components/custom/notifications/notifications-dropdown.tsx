"use client";

import { useState } from "react";
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
   * Bind open state to the notifications context so external UI (e.g. the
   * landing CTA) can open this instance. Only ONE mounted dropdown should
   * opt in, otherwise they all open together; the rest stay on local state.
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
    isMenuOpen,
    setMenuOpen,
  } = useNotifications();
  const router = useRouter();

  const [isLocalOpen, setLocalOpen] = useState(false);

  const isOpen = openViaContext ? isMenuOpen : isLocalOpen;
  const setOpen = openViaContext ? setMenuOpen : setLocalOpen;

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
          <BellRingIcon size={18} />

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
