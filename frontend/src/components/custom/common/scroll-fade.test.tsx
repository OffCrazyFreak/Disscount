import { useRef } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ScrollFade from "@/components/custom/common/scroll-fade";

interface IHarnessProps {
  rows: string[];
}

function Harness({ rows }: IHarnessProps) {
  const listRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative">
      <div ref={listRef} data-testid="list">
        {rows.map((row) => (
          <p key={row}>{row}</p>
        ))}
      </div>

      <ScrollFade targetRef={listRef} />
    </div>
  );
}

function getFade(container: HTMLElement) {
  const fade = container.querySelector("[aria-hidden]");
  if (!fade) throw new Error("fade not rendered");

  return fade;
}

let observed: Element[] = [];
let resize = () => {};

beforeEach(() => {
  observed = [];
  // jsdom has no layout, so a test resizes by hand.
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: () => void) {
        resize = callback;
      }
      observe(element: Element) {
        observed.push(element);
      }
      unobserve() {}
      disconnect() {}
    },
  );
});

describe("ScrollFade", () => {
  it("starts hidden when nothing overflows", () => {
    const { container } = render(<Harness rows={[]} />);

    expect(getFade(container)).toHaveClass("opacity-0");
  });

  it("shows once rows mounted after the first render overflow the list", async () => {
    const { container, rerender } = render(<Harness rows={["loading"]} />);
    const list = screen.getByTestId("list");

    Object.defineProperty(list, "clientHeight", { value: 100 });
    Object.defineProperty(list, "scrollHeight", {
      get: () => list.children.length * 60,
    });

    rerender(<Harness rows={["a", "b", "c"]} />);

    await waitFor(() => expect(getFade(container)).toHaveClass("opacity-100"));
  });

  it("clears when the list grows tall enough to fit its rows", () => {
    let height = 100;
    const { container } = render(<Harness rows={["a", "b", "c"]} />);
    const list = screen.getByTestId("list");
    Object.defineProperty(list, "clientHeight", { get: () => height });
    Object.defineProperty(list, "scrollHeight", { value: 180 });

    act(() => resize());
    expect(getFade(container)).toHaveClass("opacity-100");

    height = 200;
    act(() => resize());

    expect(observed).toContain(list);
    expect(getFade(container)).toHaveClass("opacity-0");
  });
});
