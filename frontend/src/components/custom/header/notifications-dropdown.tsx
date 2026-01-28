"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BellRingIcon } from "@/components/custom/icons/BellRingIcon";

// Mock notification data
const mockNotifications = [
  {
    id: 1,
    title: "Rajčica 500g je na akciji",
    message: "Konzum - 3€ (ušteda 40%)",
    time: "prije 5 min",
    isNew: true,
  },
  {
    id: 2,
    title: "Mlijeko 1L nova cijena",
    message: "Lidl - 1.20€ (ušteda 20%)",
    time: "prije 1 sat",
    isNew: true,
  },
  {
    id: 3,
    title: "Kruh integralni na akciji",
    message: "Kaufland - 2.50€ (ušteda 15%)",
    time: "prije 3 sata",
    isNew: false,
  },
  {
    id: 4,
    title: "Banane 1kg snižene",
    message: "Spar - 1.80€ (ušteda 25%)",
    time: "jučer",
    isNew: false,
  },
];

export default function NotificationsDropdown() {
  const [notifications] = useState(mockNotifications);
  const unreadCount = notifications.filter((n) => n.isNew).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <BellRingIcon size={18} />

          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-0.5 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Obavijesti</h3>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              Nema obavijesti
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer transition-colors ${
                  notification.isNew ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">
                        {notification.title}
                      </h4>
                      {notification.isNew && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {notification.time}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <div className="p-4 border-t">
            <Button variant="ghost" className="w-full text-sm">
              Označi sve kao pročitano
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
