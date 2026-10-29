import { useRef } from "react";
import { render, screen, waitFor } from "@testing-library/react";
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

beforeEach(() => {
  // jsdom has no layout, so nothing resizes on its own.
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
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
});
