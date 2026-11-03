import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import DistanceSortNote from "@/components/custom/distance-sort/distance-sort-note";
import { renderWithProviders } from "@/test/render";

const TOWNS = [
  { name: "Split", zipcodes: ["21000"] },
  { name: "Zagreb", zipcodes: ["10000"] },
];

// Browser APIs jsdom lacks, which the popover and the cmdk list measure with.
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.scrollIntoView ??= vi.fn();
});

describe("DistanceSortNote", () => {
  it("offers a town by keyboard when the location is refused", async () => {
    const onPickTown = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <DistanceSortNote
        id="note"
        state="denied"
        origin={null}
        towns={TOWNS}
        onPickTown={onPickTown}
      />,
    );

    await user.tab();
    expect(
      screen.getByRole("button", { name: "Odaberi mjesto" }),
    ).toHaveFocus();

    await user.keyboard("{Enter}");
    await user.keyboard("21000");
    await user.keyboard("{Enter}");

    expect(onPickTown).toHaveBeenCalledWith("Split");
  });

  it("names the saved place it sorted from and offers to change it", () => {
    renderWithProviders(
      <DistanceSortNote
        id="note"
        state="ready"
        origin={{ lat: 43.5, lon: 16.4, source: "saved", town: "Split" }}
        towns={TOWNS}
        onPickTown={vi.fn()}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Bez lokacije: poredano od mjesta Split.",
    );
    expect(
      screen.getByRole("button", { name: "Promijeni mjesto" }),
    ).toBeVisible();
  });

  it("offers no town for a sort that uses the location", () => {
    renderWithProviders(
      <DistanceSortNote
        id="note"
        state="ready"
        origin={{ lat: 43.5, lon: 16.4, source: "gps", town: null }}
        towns={TOWNS}
        onPickTown={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button")).toBeNull();
  });

  it("takes no room while idle but keeps the live region", () => {
    renderWithProviders(
      <DistanceSortNote
        id="note"
        state="idle"
        origin={null}
        towns={TOWNS}
        onPickTown={vi.fn()}
      />,
    );

    expect(screen.getByRole("status").parentElement).toHaveClass("sr-only");
  });

  it("keeps the change link while a picked town's sort finishes loading", () => {
    renderWithProviders(
      <DistanceSortNote
        id="note"
        state="locating"
        origin={{ lat: 43.5, lon: 16.4, source: "picked", town: "Split" }}
        towns={TOWNS}
        onPickTown={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Promijeni mjesto" }),
    ).toBeVisible();
  });
});
