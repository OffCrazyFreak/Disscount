"use client";

import { createContext, useContext, type ReactNode } from "react";

const PortalContainerContext = createContext<HTMLElement | null>(null);

interface IPortalContainerProviderProps {
  container: HTMLElement | null;
  children: ReactNode;
}

// Lets portalled popovers render inside a modal container instead of
// document.body, so touch scrolling keeps working inside vaul drawers, whose
// scroll-lock blocks touchmove outside their own subtree.
export function PortalContainerProvider({
  container,
  children,
}: IPortalContainerProviderProps) {
  return (
    <PortalContainerContext.Provider value={container}>
      {children}
    </PortalContainerContext.Provider>
  );
}

export function usePortalContainer(): HTMLElement | null {
  return useContext(PortalContainerContext);
}
