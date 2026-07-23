"use client";

import { createContext, useContext, ReactNode } from "react";
import { useWatchlistNotifications } from "@/context/use-watchlist-notifications";
import { INotificationsContext } from "@/context/notifications-types";

export type {
  INotificationStore,
  IWatchlistNotification,
} from "@/context/notifications-types";

const NotificationsContext = createContext<INotificationsContext | undefined>(
  undefined,
);

interface INotificationsProviderProps {
  children: ReactNode;
}

export function NotificationsProvider({
  children,
}: INotificationsProviderProps) {
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
