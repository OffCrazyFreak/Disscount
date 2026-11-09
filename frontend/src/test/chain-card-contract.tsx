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

const NEAREST: INearestStore = { key: "konzum:1", km: 1.2 };

const BADGE_NAME = "Otvoreno, zatvara u 21:00";

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

  function badge() {
    return screen.getByRole("button", { name: BADGE_NAME });
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

    it("opens the badge's time on keyboard focus, right after the toggle", async () => {
      const user = userEvent.setup();
      renderCard();

      await user.tab();
      await user.tab();

      expect(badge()).toHaveFocus();
      expect(await screen.findByText("Zatvara u 21:00")).toBeInTheDocument();
    });

    it("opens the badge's time on tap without toggling the card", async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      renderCard();

      await user.pointer([
        { keys: "[TouchA>]", target: badge() },
        { keys: "[/TouchA]" },
      ]);

      expect(await screen.findByText("Zatvara u 21:00")).toBeInTheDocument();
      expect(toggle()).toHaveAttribute("aria-expanded", "false");
    });

    it("never nests one interactive element in another", () => {
      const { container } = renderCard();

      expect(badge()).toBeInTheDocument();
      expect(
        container.querySelectorAll(
          "button button, button a, a button, a a, [role='button'] button",
        ),
      ).toHaveLength(0);
    });

    it("keeps a short name and describes the card's prices and nearest store", () => {
      renderCard();

      expect(toggle()).toHaveAccessibleDescription(
        expect.stringContaining("Najbliža trgovina: 1,2 km"),
      );
      expect(toggle()).toHaveAccessibleDescription(
        expect.stringContaining("Najniža: 1,00"),
      );
    });

    it("has no badge and no dangling description without a nearest store", () => {
      const { container } = renderWithProviders(
        <StoreHoursProvider hours={hours}>{card()}</StoreHoursProvider>,
      );

      expect(
        screen.queryByRole("button", { name: BADGE_NAME }),
      ).not.toBeInTheDocument();

      const ids = toggle().getAttribute("aria-describedby")?.split(" ") ?? [];

      expect(ids.length).toBeGreaterThan(0);
      for (const id of ids) {
        expect(container.ownerDocument.getElementById(id)).not.toBeNull();
      }
    });
  });
}
