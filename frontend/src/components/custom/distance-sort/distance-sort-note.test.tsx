import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import DistanceSortNote from "@/components/custom/distance-sort/distance-sort-note";
import { renderWithProviders } from "@/test/render";

const TOWNS = [
  { key: "Split", name: "Split", county: null, zipcodes: ["21000"] },
  { key: "Zagreb", name: "Zagreb", county: null, zipcodes: ["10000"] },
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

  it("tells apart towns that share a name by county", async () => {
    const onPickTown = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <DistanceSortNote
        id="note"
        state="denied"
        origin={null}
        towns={[
          {
            key: "Sveta Nedelja|10",
            name: "Sveta Nedelja",
            county: "zagrebCounty",
            zipcodes: ["10431"],
          },
          {
            key: "Sveta Nedelja|52",
            name: "Sveta Nedelja",
            county: "istria",
            zipcodes: ["52466"],
          },
        ]}
        onPickTown={onPickTown}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Odaberi mjesto" }));
    await user.click(
      screen.getByRole("option", { name: "Sveta Nedelja (Istarska)" }),
    );

    expect(onPickTown).toHaveBeenCalledWith("Sveta Nedelja|52");
  });

  it("names the county of a namesake it sorted from", () => {
    renderWithProviders(
      <DistanceSortNote
        id="note"
        state="ready"
        origin={{
          lat: 45.06,
          lon: 14.06,
          source: "picked",
          town: "Sveta Nedelja",
          county: "istria",
        }}
        towns={TOWNS}
        onPickTown={vi.fn()}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Sveta Nedelja (Istarska)",
    );
  });

  it("names the saved place it sorted from and offers to change it", () => {
    renderWithProviders(
      <DistanceSortNote
        id="note"
        state="ready"
        origin={{
          lat: 43.5,
          lon: 16.4,
          source: "saved",
          town: "Split",
          county: null,
        }}
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
        origin={{
          lat: 43.5,
          lon: 16.4,
          source: "gps",
          town: null,
          county: null,
        }}
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
        origin={{
          lat: 43.5,
          lon: 16.4,
          source: "picked",
          town: "Split",
          county: null,
        }}
        towns={TOWNS}
        onPickTown={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Promijeni mjesto" }),
    ).toBeVisible();
  });
});
