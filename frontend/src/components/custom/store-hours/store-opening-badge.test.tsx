import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import StoreHoursProvider from "@/components/custom/store-hours/store-hours-context";
import StoreOpeningBadge from "@/components/custom/store-hours/store-opening-badge";
import type { StoreHoursResponse } from "@/lib/api/schemas";
import type { IStoreHoursNow } from "@/lib/store-hours/store-opening";
import { renderWithProviders } from "@/test/render";

const week = [{ opens: "07:00", closes: "21:00" }];

const late = [{ opens: "07:00", closes: "02:00" }];

const data: StoreHoursResponse = {
  stores: {
    "konzum:late": {
      weekly: [late, late, late, late, late, late, []],
      dated: [],
      sundays: "dated",
      source: "chain",
      verifiedAt: "2026-11-02T06:00:00.000Z",
      checkUrl: null,
    },
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
  it("names an open store with its closing time", () => {
    renderAt("2026-11-04T10:00:00", "konzum:1");

    expect(
      screen.getByRole("button", { name: "Otvoreno, zatvara u 21:00" }),
    ).toHaveTextContent("Otvoreno");
  });

  it("keeps the word and adds soon to the name in the last hour", () => {
    renderAt("2026-11-04T20:15:00", "konzum:1");

    expect(
      screen.getByRole("button", { name: "Otvoreno, zatvara uskoro u 21:00" }),
    ).toHaveTextContent("Otvoreno");
  });

  it("names when a closed store opens next", () => {
    renderAt("2026-11-04T22:00:00", "konzum:1");

    expect(
      screen.getByRole("button", { name: "Zatvoreno, otvara sutra u 7:00" }),
    ).toHaveTextContent("Zatvoreno");
  });

  it("shows the opening time on tap in the hour before it opens", async () => {
    renderAt("2026-11-04T06:30:00", "konzum:1");

    await userEvent.click(
      screen.getByRole("button", { name: "Zatvoreno, otvara uskoro u 7:00" }),
    );

    expect(await screen.findByText("Otvara uskoro u 7:00")).toBeInTheDocument();
  });

  it("shows the closing time on hover and on keyboard focus", async () => {
    const user = userEvent.setup();
    renderAt("2026-11-04T10:00:00", "konzum:1");

    await user.hover(screen.getByRole("button"));
    expect(await screen.findByText("Zatvara u 21:00")).toBeInTheDocument();

    await user.unhover(screen.getByRole("button"));
    await user.tab();
    expect(await screen.findByText("Zatvara u 21:00")).toBeInTheDocument();
  });

  it("names the day when a late shift closes after midnight", () => {
    renderAt("2026-11-04T10:00:00", "konzum:late");

    expect(
      screen.getByRole("button", {
        name: "Otvoreno, zatvara sutra u 2:00",
      }),
    ).toBeInTheDocument();
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
