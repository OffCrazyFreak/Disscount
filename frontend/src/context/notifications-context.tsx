"use client";

import { createContext, useContext, ReactNode } from "react";
import { useWatchlistNotifications } from "./use-watchlist-notifications";
import { INotificationsContext } from "./notifications-types";

export type {
  NotificationStore,
  WatchlistNotification,
} from "./notifications-types";

const NotificationsContext = createContext<INotificationsContext | undefined>(
  undefined,
);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const value = useWatchlistNotifications();

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider",
    );
  }
  return context;
}
