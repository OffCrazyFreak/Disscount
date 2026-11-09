import type { ReactElement } from "react";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import StoreHoursProvider from "@/components/custom/store-hours/store-hours-context";
import type { StoreHoursResponse } from "@/lib/api/schemas";
import type { IStoreHoursNow } from "@/lib/store-hours/store-opening";
import { renderWithProviders } from "@/test/render";
import type { INearestStore } from "@/utils/nearest-chain-distance";

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

// A Wednesday morning in Zagreb, with the store open until 21:00.
const hours: IStoreHoursNow = {
  data,
  holidays: new Set(),
  now: new Date("2026-11-04T10:00:00+01:00"),
};

const NEAREST: INearestStore = {
  key: "konzum:1",
  km: 1.2,
  address: "Ilica 1",
  city: "Zagreb",
};

const DISTANCE_NAME = "Najbliža trgovina, 1,2 km: Ilica 1, Zagreb, Otvoreno";

/** Shared by both chain cards, so `card` must show a chain called Konzum and `DETAILS` once expanded. */
export function describeChainCard(
  label: string,
  card: (nearest?: INearestStore) => ReactElement,
) {
  function renderCard(nearest: INearestStore | undefined = NEAREST) {
    return renderWithProviders(
      <StoreHoursProvider hours={hours}>{card(nearest)}</StoreHoursProvider>,
    );
  }

  function toggle() {
    return within(screen.getByRole("heading", { name: "Konzum" })).getByRole(
      "button",
      { name: "Konzum" },
    );
  }

  function distance() {
    return screen.getByRole("button", { name: DISTANCE_NAME });
  }

  describe(`${label} chain card`, () => {
    it("expands and collapses from the keyboard", async () => {
      const user = userEvent.setup();
      renderCard();

      await user.tab();
      expect(toggle()).toHaveFocus();
      expect(toggle()).toHaveAttribute("aria-expanded", "false");

      await user.keyboard("{Enter}");
      expect(toggle()).toHaveAttribute("aria-expanded", "true");
      expect(await screen.findByText("DETAILS")).toBeInTheDocument();

      await user.keyboard(" ");
      expect(toggle()).toHaveAttribute("aria-expanded", "false");
    });

    it("shows the distance in brackets beside the chain name", () => {
      renderCard();

      expect(distance()).toHaveTextContent("(1,2 km)");
    });

    it("opens the nearest store on keyboard focus, right after the toggle", async () => {
      const user = userEvent.setup();
      renderCard();

      await user.tab();
      await user.tab();

      expect(distance()).toHaveFocus();
      expect(await screen.findByText("Ilica 1, Zagreb")).toBeInTheDocument();
    });

    it("opens the nearest store on hover with its state and no times", async () => {
      const user = userEvent.setup();
      renderCard();

      await user.hover(distance());

      expect(await screen.findByText("Ilica 1, Zagreb")).toBeInTheDocument();
      expect(screen.getByText("Otvoreno")).toBeInTheDocument();
      expect(screen.queryByText(/21:00/)).not.toBeInTheDocument();
    });

    it("opens the nearest store on tap without toggling the card", async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      renderCard();

      await user.pointer([
        { keys: "[TouchA>]", target: distance() },
        { keys: "[/TouchA]" },
      ]);

      expect(await screen.findByText("Ilica 1, Zagreb")).toBeInTheDocument();
      expect(toggle()).toHaveAttribute("aria-expanded", "false");
    });

    it("names only the address when the store's hours are unconfirmed", () => {
      renderCard({ ...NEAREST, key: "konzum:2" });

      expect(
        screen.getByRole("button", {
          name: "Najbliža trgovina, 1,2 km: Ilica 1, Zagreb",
        }),
      ).toBeInTheDocument();
    });

    it("never nests one interactive element in another", () => {
      const { container } = renderCard();

      expect(distance()).toBeInTheDocument();
      expect(
        container.querySelectorAll(
          "button button, button a, a button, a a, [role='button'] button",
        ),
      ).toHaveLength(0);
    });

    it("keeps a short name and describes the card's prices", () => {
      renderCard();

      expect(toggle()).toHaveAccessibleDescription(
        expect.stringContaining("Najniža: 1,00"),
      );
    });

    it("has no distance and no dangling description without a nearest store", () => {
      const { container } = renderWithProviders(
        <StoreHoursProvider hours={hours}>{card()}</StoreHoursProvider>,
      );

      expect(
        screen.queryByRole("button", { name: /Najbliža trgovina/ }),
      ).not.toBeInTheDocument();

      const ids = toggle().getAttribute("aria-describedby")?.split(" ") ?? [];

      expect(ids.length).toBeGreaterThan(0);
      for (const id of ids) {
        expect(container.ownerDocument.getElementById(id)).not.toBeNull();
      }
    });
  });
}
