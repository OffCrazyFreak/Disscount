import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import StoreHoursProvider from "@/components/custom/store-hours/store-hours-context";
import StoreWeekHours from "@/components/custom/store-hours/store-week-hours";
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
    "konzum:stale": {
      weekly: [week, week, week, week, week, week, []],
      dated: [],
      sundays: "dated",
      source: "chain",
      verifiedAt: "2026-09-01T06:00:00.000Z",
      checkUrl: null,
    },
  },
  holidays: [],
  generatedAt: "2026-11-04T06:00:00.000Z",
};

// A Wednesday, so the list runs Wednesday to Tuesday.
const hours: IStoreHoursNow = {
  data,
  holidays: new Set(),
  now: new Date("2026-11-04T10:00:00+01:00"),
};

function renderWeek(storeKey: string) {
  return renderWithProviders(
    <StoreHoursProvider hours={hours}>
      <StoreWeekHours storeKey={storeKey} />
    </StoreHoursProvider>,
  );
}

describe("StoreWeekHours", () => {
  it("lists seven days from today and marks today", () => {
    renderWeek("konzum:1");

    const days = within(
      screen.getByRole("region", { name: "Radno vrijeme" }),
    ).getAllByRole("listitem");

    expect(days).toHaveLength(7);
    expect(days[0]).toHaveAttribute("aria-current", "date");
    expect(days[0]).toHaveTextContent("Srijeda");
    expect(days[0]).toHaveTextContent("7:00 - 21:00");
  });

  it("says a Sunday under the trading law is only some Sundays", () => {
    renderWeek("konzum:1");

    expect(screen.getByText("Samo neke nedjelje")).toBeInTheDocument();
  });

  it("renders nothing when no day is known", () => {
    renderWeek("konzum:stale");

    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });
});
