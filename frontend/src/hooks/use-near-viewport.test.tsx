import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useNearViewport } from "@/hooks/use-near-viewport";
import {
  findIntersectionObserver,
  stubIntersectionObserver,
} from "@/test/fake-intersection-observer";

function Probe() {
  const [ref, isNear] = useNearViewport<HTMLDivElement>();

  return <div ref={ref}>{isNear ? "near" : "far"}</div>;
}

function observer() {
  return findIntersectionObserver(() => true);
}

describe("useNearViewport", () => {
  it("waits until the element comes near the screen", () => {
    stubIntersectionObserver();
    render(<Probe />);

    expect(screen.getByText("far")).toBeInTheDocument();
    expect(observer().options.rootMargin).toBe("600px 0px");

    act(() => observer().fire([{ isIntersecting: true }]));

    expect(screen.getByText("near")).toBeInTheDocument();
  });

  it("stays near once it has been near, and stops observing", () => {
    stubIntersectionObserver();
    render(<Probe />);
    const first = observer();

    act(() => first.fire([{ isIntersecting: true }]));
    act(() => first.fire([{ isIntersecting: false }]));

    expect(screen.getByText("near")).toBeInTheDocument();
    expect(first.isDisconnected).toBe(true);
  });

  it("loads straight away where the browser has no IntersectionObserver", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    render(<Probe />);

    expect(screen.getByText("near")).toBeInTheDocument();
  });
});
