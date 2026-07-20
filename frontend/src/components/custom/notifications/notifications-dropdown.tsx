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

export default function NotificationsDropdown() {
  const {
    notifications,
    summary,
    isLoading,
    hasNotifications,
    hasWatchlistItems,
  } = useNotifications();
  const router = useRouter();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  function handleAddProducts() {
    setIsDropdownOpen(false);

    router.push("/watchlist");
  }

  return (
    <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <BellRingIcon size={18} />

          {hasNotifications && (
            <Badge className="absolute -top-1 -right-0.5">
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
          onSelect={() => setIsDropdownOpen(false)}
          onAddProducts={handleAddProducts}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
