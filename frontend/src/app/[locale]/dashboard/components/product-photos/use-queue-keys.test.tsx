import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useQueueKeys } from "@/app/[locale]/dashboard/components/product-photos/use-queue-keys";

function setup() {
  const handlers = {
    onNext: vi.fn(),
    onPrevious: vi.fn(),
    onReviewed: vi.fn(),
  };
  renderHook(() => useQueueKeys(handlers));
  return handlers;
}

function press(target: EventTarget, key: string) {
  target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
}

describe("useQueueKeys", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("moves and marks reviewed from J, K and R", () => {
    const { onNext, onPrevious, onReviewed } = setup();

    press(document.body, "j");
    press(document.body, "K");
    press(document.body, "r");

    expect(onNext).toHaveBeenCalledOnce();
    expect(onPrevious).toHaveBeenCalledOnce();
    expect(onReviewed).toHaveBeenCalledOnce();
  });

  it("handles a key whose target is the document, not an element", () => {
    const { onNext } = setup();

    press(document, "j");

    expect(onNext).toHaveBeenCalledOnce();
  });

  it("leaves typing alone", () => {
    const { onNext } = setup();
    const input = document.createElement("input");
    document.body.append(input);

    press(input, "j");

    expect(onNext).not.toHaveBeenCalled();
  });
});
