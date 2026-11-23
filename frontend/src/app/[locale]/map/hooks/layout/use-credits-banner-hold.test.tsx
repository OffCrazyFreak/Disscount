import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CREDITS_BANNER_HOLD,
  useCreditsBannerHold,
} from "@/app/[locale]/map/hooks/layout/use-credits-banner-hold";
import {
  releaseInstallBannerHold,
  useIsInstallBannerHeld,
} from "@/components/custom/pwa/install-banner-hold";

function renderHold() {
  return renderHook(() => {
    useCreditsBannerHold();

    return useIsInstallBannerHeld();
  });
}

afterEach(() => {
  vi.useRealTimers();
});

describe("useCreditsBannerHold", () => {
  it("holds the banner from the first render until the credits fold", () => {
    const { result } = renderHold();
    expect(result.current).toBe(true);

    act(() => releaseInstallBannerHold(CREDITS_BANNER_HOLD));
    expect(result.current).toBe(false);
  });

  it("lets the banner show after 15 seconds when the map never loads", () => {
    vi.useFakeTimers();
    const { result } = renderHold();

    act(() => vi.advanceTimersByTime(14_999));
    expect(result.current).toBe(true);

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe(false);
  });
});
