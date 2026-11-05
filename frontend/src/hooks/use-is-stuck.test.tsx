import { act, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it } from "vitest";

import { HEADER_BOTTOM_CHANGE_EVENT } from "@/hooks/use-header-bottom-variable";
import { useIsStuck } from "@/hooks/use-is-stuck";

let containerTop = 200;

function Probe() {
  const containerRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const isStuck = useIsStuck(containerRef, barRef);

  return (
    <div
      ref={(node) => {
        containerRef.current = node;
        if (node) {
          node.getBoundingClientRect = () => ({ top: containerTop }) as DOMRect;
        }
      }}
    >
      <div ref={barRef} style={{ position: "sticky", top: "100px" }}>
        {isStuck ? "stuck" : "free"}
      </div>
    </div>
  );
}

describe("useIsStuck", () => {
  it("follows scrolling past the bar's sticky top", () => {
    containerTop = 200;
    render(<Probe />);
    expect(screen.getByText("free")).toBeInTheDocument();

    act(() => {
      containerTop = 40;
      window.dispatchEvent(new Event("scroll"));
    });
    expect(screen.getByText("stuck")).toBeInTheDocument();
  });

  it("counts a container exactly on the sticky top as stuck", () => {
    containerTop = 100;
    render(<Probe />);

    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    expect(screen.getByText("stuck")).toBeInTheDocument();
  });

  it("re-reads when the header changes size without a scroll", () => {
    containerTop = 40;
    render(<Probe />);
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    expect(screen.getByText("stuck")).toBeInTheDocument();

    act(() => {
      containerTop = 200;
      window.dispatchEvent(new Event(HEADER_BOTTOM_CHANGE_EVENT));
    });
    expect(screen.getByText("free")).toBeInTheDocument();
  });
});
