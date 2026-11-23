import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  releaseInstallBannerHold,
  useInstallBannerHold,
  useIsInstallBannerHeld,
} from "@/components/custom/pwa/install-banner-hold";

function renderHold(key: string, isHeld: boolean) {
  return renderHook(
    ({ held }) => {
      useInstallBannerHold(key, held);

      return useIsInstallBannerHeld();
    },
    { initialProps: { held: isHeld } },
  );
}

describe("install banner holds", () => {
  it("hides the banner while a page part holds it, and shows it again when that part lets go", () => {
    const { result, rerender } = renderHold("map-search", true);
    expect(result.current).toBe(true);

    rerender({ held: false });
    expect(result.current).toBe(false);
  });

  it("lets the map's credits folding lift its hold without the holder asking again", () => {
    const { result } = renderHold("map-credits", true);
    expect(result.current).toBe(true);

    act(() => releaseInstallBannerHold("map-credits"));
    expect(result.current).toBe(false);
  });

  it("drops a hold when its holder leaves the page", () => {
    const { result, unmount } = renderHold("map-credits", true);
    const observer = renderHook(() => useIsInstallBannerHeld());
    expect(result.current).toBe(true);

    unmount();
    expect(observer.result.current).toBe(false);
  });
});
