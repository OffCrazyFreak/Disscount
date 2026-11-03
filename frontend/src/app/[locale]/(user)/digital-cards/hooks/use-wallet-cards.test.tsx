import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useWalletCards } from "@/app/[locale]/(user)/digital-cards/hooks/use-wallet-cards";

const { restoring } = vi.hoisted(() => ({ restoring: { value: true } }));

vi.mock("@tanstack/react-query", () => ({
  useIsRestoring: () => restoring.value,
}));
vi.mock("@/context/user-context", () => ({
  useUser: () => ({
    isAuthenticated: false,
    canShowAccountData: true,
    isLoading: false,
  }),
}));
vi.mock("@/lib/api", () => ({
  digitalCardService: {
    useGetMyDigitalCards: () => ({ data: undefined, isLoading: false }),
  },
}));

describe("useWalletCards offline", () => {
  it("shows the saved cards for an account the session check could not confirm", () => {
    restoring.value = false;
    const { result } = renderHook(() => useWalletCards());

    expect(result.current.canShowCards).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it("stays loading until the cards are read back from disk", () => {
    restoring.value = true;
    const { result } = renderHook(() => useWalletCards());

    expect(result.current.isLoading).toBe(true);
  });
});
