import * as Sentry from "@sentry/nextjs";
import { render, screen } from "@testing-library/react";
import { Component, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ComponentStackBoundary from "@/components/custom/common/component-stack-boundary";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  captureReactException: vi.fn(),
}));

class OuterBoundary extends Component<
  { children: ReactNode },
  { caught: unknown }
> {
  state = { caught: null as unknown };

  static getDerivedStateFromError(caught: unknown) {
    return { caught };
  }

  render() {
    return this.state.caught ? <p>outer caught</p> : this.props.children;
  }
}

function Thrower({ error }: { error: Error }): ReactNode {
  throw error;
}

function renderThrowing(error: Error) {
  vi.spyOn(console, "error").mockImplementation(() => {});
  render(
    <OuterBoundary>
      <ComponentStackBoundary>
        <Thrower error={error} />
      </ComponentStackBoundary>
    </OuterBoundary>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("ComponentStackBoundary", () => {
  it("reports the error with its component stack, then hands it on", () => {
    const error = new Error("Maximum update depth exceeded");
    renderThrowing(error);

    expect(Sentry.captureReactException).toHaveBeenCalledTimes(1);
    expect(Sentry.captureReactException).toHaveBeenCalledWith(
      error,
      { componentStack: expect.stringContaining("Thrower") },
      undefined,
    );
    expect(screen.getByText("outer caught")).toBeInTheDocument();
  });

  it("leaves a chunk load error to the reload recovery", () => {
    renderThrowing(
      Object.assign(new Error("Loading chunk 42 failed."), {
        name: "ChunkLoadError",
      }),
    );

    expect(Sentry.captureReactException).not.toHaveBeenCalled();
    expect(screen.getByText("outer caught")).toBeInTheDocument();
  });

  it("does not report Next's notFound control flow", () => {
    renderThrowing(
      Object.assign(new Error("NEXT_HTTP_ERROR_FALLBACK;404"), {
        digest: "NEXT_HTTP_ERROR_FALLBACK;404",
      }),
    );

    expect(Sentry.captureReactException).not.toHaveBeenCalled();
    expect(screen.getByText("outer caught")).toBeInTheDocument();
  });

  it("renders its children when nothing throws", () => {
    render(
      <ComponentStackBoundary>
        <p>fine</p>
      </ComponentStackBoundary>,
    );

    expect(screen.getByText("fine")).toBeInTheDocument();
  });
});
