import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import useBadgeOverflow from "@/components/custom/form/use-badge-overflow";

const VALUES = new Set(["Konzum", "Lidl", "Spar"]);
const ITEMS = new Map([...VALUES].map((value) => [value, value]));

const ROW_WIDTH = 100;
const OVERFLOW_BADGE_WIDTH = 20;

let isWebFontLoaded = false;
let resolveFontsReady = () => {};

function Harness() {
  const { containerRef, overflowRef, overflowAmount } = useBadgeOverflow(
    VALUES,
    false,
    ITEMS,
  );

  return (
    <div ref={containerRef}>
      {[...VALUES].map((value) => (
        <div key={value} data-selected-item>
          {value}
        </div>
      ))}
      <div ref={overflowRef}>+{overflowAmount}</div>
    </div>
  );
}

// jsdom has no layout: the row is as wide as its shown children, and the web
// font makes every badge wider than the fallback font did.
function stubLayout() {
  const isShown = (element: Element) =>
    (element as HTMLElement).style.display !== "none";

  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(
    ROW_WIDTH,
  );
  vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockImplementation(
    function (this: HTMLElement) {
      return [...this.children].filter(isShown).reduce((width, child) => {
        if (!child.hasAttribute("data-selected-item"))
          return width + OVERFLOW_BADGE_WIDTH;
        return width + (isWebFontLoaded ? 40 : 30);
      }, 0);
    },
  );
}

beforeEach(() => {
  isWebFontLoaded = false;
  stubLayout();

  const ready = new Promise<void>((resolve) => {
    resolveFontsReady = resolve;
  });
  Object.defineProperty(document, "fonts", {
    configurable: true,
    value: { ready },
  });
});

afterEach(() => {
  Reflect.deleteProperty(document, "fonts");
});

describe("useBadgeOverflow", () => {
  it("re-measures once a late web font has widened the badges", async () => {
    render(<Harness />);

    expect(screen.getByText("+0")).toBeInTheDocument();

    isWebFontLoaded = true;
    await act(async () => resolveFontsReady());

    expect(screen.getByText("+1")).toBeInTheDocument();
    expect(screen.getByText("Spar")).toHaveStyle({ display: "none" });
  });
});
