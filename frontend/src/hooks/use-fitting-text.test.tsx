import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useRef } from "react";

import { useFittingText } from "@/hooks/use-fitting-text";
import { stubTextFit, textWidth } from "@/test/stub-text-fit";

const FULL = "Trgovina, grad ili adresa";
const SHORT = "Trgovina";

function Harness({ fallback }: { fallback?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const text = useFittingText(ref, FULL, fallback);

  return <input ref={ref} placeholder={text} />;
}

describe("useFittingText", () => {
  it("keeps the full text when the text box is wide enough for it", () => {
    stubTextFit(textWidth(FULL));
    render(<Harness fallback={SHORT} />);

    expect(screen.getByRole("textbox")).toHaveAttribute("placeholder", FULL);
  });

  it("falls back to the short text when the box is a pixel too narrow", () => {
    stubTextFit(textWidth(FULL) - 1);
    render(<Harness fallback={SHORT} />);

    expect(screen.getByRole("textbox")).toHaveAttribute("placeholder", SHORT);
  });

  it("shows the full text when there is nothing shorter to fall back to", () => {
    stubTextFit(10);
    render(<Harness />);

    expect(screen.getByRole("textbox")).toHaveAttribute("placeholder", FULL);
  });

  it("does not read the unmeasured box as too narrow when fonts are ready first", async () => {
    stubTextFit(textWidth(FULL));
    let reportBox = () => {};
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(private readonly callback: ResizeObserverCallback) {}
        observe() {
          reportBox = () =>
            this.callback(
              [
                {
                  contentRect: { width: textWidth(FULL) },
                } as ResizeObserverEntry,
              ],
              this as unknown as ResizeObserver,
            );
        }
        disconnect() {}
      },
    );
    Object.defineProperty(document, "fonts", {
      configurable: true,
      value: { ready: Promise.resolve() },
    });

    render(<Harness fallback={SHORT} />);
    await act(async () => {});

    expect(screen.getByRole("textbox")).toHaveAttribute("placeholder", FULL);

    act(() => reportBox());
    expect(screen.getByRole("textbox")).toHaveAttribute("placeholder", FULL);

    Reflect.deleteProperty(document, "fonts");
  });
});
