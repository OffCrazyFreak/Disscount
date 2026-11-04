import { vi } from "vitest";

const CHARACTER_WIDTH = 8;

/**
 * jsdom has no layout and no canvas: every character is 8 px wide, and the observed
 * element reports `boxWidth` as its text box as soon as it is observed.
 */
export function stubTextFit(boxWidth: number) {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    () =>
      ({
        font: "",
        letterSpacing: "",
        measureText: (text: string) => ({
          width: text.length * CHARACTER_WIDTH,
        }),
      }) as unknown as CanvasRenderingContext2D,
  );

  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(private readonly callback: ResizeObserverCallback) {}
      observe() {
        this.callback(
          [{ contentRect: { width: boxWidth } } as ResizeObserverEntry],
          this as unknown as ResizeObserver,
        );
      }
      disconnect() {}
    },
  );
}

export const textWidth = (text: string) => text.length * CHARACTER_WIDTH;
