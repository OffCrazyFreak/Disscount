"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { SecuritySettings } from "@/components/custom/settings/security/hooks/use-security-settings";

const SecurityContext = createContext<SecuritySettings | null>(null);

interface ISecurityProviderProps {
  value: SecuritySettings;
  children: ReactNode;
}

export default function SecurityProvider({
  value,
  children,
}: ISecurityProviderProps) {
  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error("useSecurity must be used within a SecurityProvider");
  }
  return context;
}
