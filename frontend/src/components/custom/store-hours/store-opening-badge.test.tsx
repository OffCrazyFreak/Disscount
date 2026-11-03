import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import StoreHoursProvider from "@/components/custom/store-hours/store-hours-context";
import StoreOpeningBadge from "@/components/custom/store-hours/store-opening-badge";
import type { StoreHoursResponse } from "@/lib/api/schemas";
import type { IStoreHoursNow } from "@/lib/store-hours/store-opening";
import { renderWithProviders } from "@/test/render";

const week = [{ opens: "07:00", closes: "21:00" }];

const data: StoreHoursResponse = {
  stores: {
    "konzum:1": {
      weekly: [week, week, week, week, week, week, []],
      dated: [],
      sundays: "dated",
      source: "chain",
      verifiedAt: "2026-11-02T06:00:00.000Z",
      checkUrl: null,
    },
  },
  holidays: [],
  generatedAt: "2026-11-02T06:00:00.000Z",
};

// 2026-11-04 is a Wednesday; Zagreb is UTC+1 in November.
function renderAt(local: string, storeKey: string) {
  const hours: IStoreHoursNow = {
    data,
    holidays: new Set(),
    now: new Date(`${local}+01:00`),
  };

  return renderWithProviders(
    <StoreHoursProvider hours={hours}>
      <StoreOpeningBadge storeKey={storeKey} />
    </StoreHoursProvider>,
  );
}

describe("StoreOpeningBadge", () => {
  it("shows a store open with its closing time", () => {
    renderAt("2026-11-04T10:00:00", "konzum:1");

    expect(screen.getByText("Otvoreno")).toBeInTheDocument();
    expect(screen.getByText("zatvara u 21:00")).toBeInTheDocument();
  });

  it("warns in the last hour", () => {
    renderAt("2026-11-04T20:15:00", "konzum:1");

    expect(screen.getByText("Zatvara uskoro")).toBeInTheDocument();
  });

  it("shows when a closed store opens next", () => {
    renderAt("2026-11-04T22:00:00", "konzum:1");

    expect(screen.getByText("Zatvoreno")).toBeInTheDocument();
    expect(screen.getByText("otvara sutra u 07:00")).toBeInTheDocument();
  });

  it("calls a store with no hours unconfirmed", () => {
    renderAt("2026-11-04T10:00:00", "konzum:2");

    expect(
      screen.getByText("Radno vrijeme nije potvrđeno"),
    ).toBeInTheDocument();
  });

  it("renders nothing before the hours load", () => {
    const { container } = renderWithProviders(
      <StoreHoursProvider hours={null}>
        <StoreOpeningBadge storeKey="konzum:1" />
      </StoreHoursProvider>,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
