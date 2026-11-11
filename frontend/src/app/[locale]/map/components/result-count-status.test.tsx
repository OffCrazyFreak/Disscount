import { act, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ResultCountStatus from "@/app/[locale]/map/components/result-count-status";
import { renderWithProviders } from "@/test/render";

describe("ResultCountStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("names the stores with no pin on the map", () => {
    renderWithProviders(<ResultCountStatus shown={12} unplaced={2} />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "12 trgovina, od toga 2 bez lokacije na karti.",
    );
  });

  it("reads only the count the filters settle on", async () => {
    const { rerender } = renderWithProviders(
      <ResultCountStatus shown={40} unplaced={0} />,
    );

    rerender(<ResultCountStatus shown={12} unplaced={0} />);
    await act(() => vi.advanceTimersByTimeAsync(300));
    rerender(<ResultCountStatus shown={3} unplaced={0} />);
    await act(() => vi.advanceTimersByTimeAsync(300));

    expect(screen.getByRole("status")).toHaveTextContent(/^40 trgovina$/);

    await act(() => vi.advanceTimersByTimeAsync(600));

    expect(screen.getByRole("status")).toHaveTextContent(/^3 trgovine$/);
  });
});
