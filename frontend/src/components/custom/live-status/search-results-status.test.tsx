import { act, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import SearchResultsStatus from "@/components/custom/live-status/search-results-status";
import { renderWithProviders } from "@/test/render";

async function settle() {
  await act(() => vi.advanceTimersByTimeAsync(600));
}

describe("SearchResultsStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("stays empty with no query", async () => {
    renderWithProviders(<SearchResultsStatus query="" count={4} />);
    await settle();

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("stays empty with a query of spaces", async () => {
    renderWithProviders(<SearchResultsStatus query="   " count={4} />);
    await settle();

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("stays empty while the data loads", async () => {
    renderWithProviders(
      <SearchResultsStatus query="mlijeko" count={0} isLoading />,
    );
    await settle();

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it.each([
    [0, 'Nema rezultata za "mlijeko"'],
    [1, '1 rezultat za "mlijeko"'],
    [3, '3 rezultata za "mlijeko"'],
    [5, '5 rezultata za "mlijeko"'],
  ])("reads %i with the Croatian plural", async (count, expected) => {
    const { rerender } = renderWithProviders(
      <SearchResultsStatus query="" count={count} />,
    );

    rerender(<SearchResultsStatus query=" mlijeko " count={count} />);
    await settle();

    expect(screen.getByRole("status")).toHaveTextContent(
      new RegExp(`^${expected}$`),
    );
  });

  it("uses the Slovenian dual", async () => {
    const { rerender } = renderWithProviders(
      <SearchResultsStatus query="" count={2} />,
      { locale: "sl" },
    );

    rerender(<SearchResultsStatus query="mleko" count={2} />);
    await settle();

    expect(screen.getByRole("status")).toHaveTextContent(
      /^2 rezultata za "mleko"$/,
    );
  });

  it("announces a burst of typing once, after it settles", async () => {
    const { rerender } = renderWithProviders(
      <SearchResultsStatus query="" count={9} />,
    );
    const changes: string[] = [];
    const observer = new MutationObserver(() =>
      changes.push(screen.getByRole("status").textContent ?? ""),
    );
    observer.observe(screen.getByRole("status"), {
      childList: true,
      characterData: true,
      subtree: true,
    });

    rerender(<SearchResultsStatus query="m" count={5} />);
    await act(() => vi.advanceTimersByTimeAsync(200));
    rerender(<SearchResultsStatus query="ml" count={4} />);
    await act(() => vi.advanceTimersByTimeAsync(200));
    rerender(<SearchResultsStatus query="mli" count={3} />);
    await act(() => vi.advanceTimersByTimeAsync(200));

    expect(screen.getByRole("status")).toBeEmptyDOMElement();

    await settle();

    expect(screen.getByRole("status")).toHaveTextContent(
      /^3 rezultata za "mli"$/,
    );
    expect(changes).toEqual(['3 rezultata za "mli"']);
    observer.disconnect();
  });

  it("announces a new search that settles on the same count", async () => {
    const { rerender } = renderWithProviders(
      <SearchResultsStatus query="mlijeko" count={3} />,
    );

    rerender(<SearchResultsStatus query="sir" count={3} />);
    await settle();

    expect(screen.getByRole("status")).toHaveTextContent(
      /^3 rezultata za "sir"$/,
    );
  });

  it("empties once the query is cleared", async () => {
    const { rerender } = renderWithProviders(
      <SearchResultsStatus query="" count={3} />,
    );

    rerender(<SearchResultsStatus query="sir" count={3} />);
    await settle();
    rerender(<SearchResultsStatus query="" count={10} />);
    await settle();

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("keeps the same region across updates", async () => {
    const { rerender } = renderWithProviders(
      <SearchResultsStatus query="" count={3} isLoading />,
    );
    const region = screen.getByRole("status");

    rerender(<SearchResultsStatus query="sir" count={3} />);
    await settle();
    rerender(<SearchResultsStatus query="sir" count={1} isLoading />);
    await settle();

    expect(screen.getByRole("status")).toBe(region);
  });
});
