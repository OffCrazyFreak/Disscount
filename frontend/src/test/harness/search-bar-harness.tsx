import type { ReactNode } from "react";
import { vi } from "vitest";

import { SidebarProvider } from "@/components/ui/sidebar";
import { CameraScannerProvider } from "@/context/scanner-context";

/** What the mocked App Router reports. Import this file before the search bar, so its mocks win. */
export const router = {
  pathname: "/products",
  search: "",
  push: vi.fn(),
  replace: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(router.search),
}));
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => router.pathname,
  useRouter: () => ({ push: router.push, replace: router.replace }),
}));

export function searchBarShell(children: ReactNode) {
  return (
    <SidebarProvider>
      <CameraScannerProvider>{children}</CameraScannerProvider>
    </SidebarProvider>
  );
}
