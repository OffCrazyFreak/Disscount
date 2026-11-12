import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAutoOpenSingleCard } from "@/app/[locale]/(user)/digital-cards/hooks/use-auto-open-single-card";
import { openModalUrl } from "@/lib/modal/modal-navigation";

vi.mock("@/lib/modal/modal-navigation", () => ({ openModalUrl: vi.fn() }));

describe("useAutoOpenSingleCard", () => {
  beforeEach(() => {
    vi.mocked(openModalUrl).mockClear();
    sessionStorage.clear();
    window.history.replaceState(null, "", "/digital-cards");
  });

  it("opens the only card once per session", () => {
    renderHook(() =>
      useAutoOpenSingleCard({ ready: true, singleCardId: "c1" }),
    );

    expect(openModalUrl).toHaveBeenCalledWith({
      name: "digital-card",
      action: "view",
      id: "c1",
    });
  });

  it("leaves a link to a tab alone", () => {
    window.history.replaceState(null, "", "/digital-cards#archived");

    renderHook(() =>
      useAutoOpenSingleCard({ ready: true, singleCardId: "c1" }),
    );

    expect(openModalUrl).not.toHaveBeenCalled();
  });
});
