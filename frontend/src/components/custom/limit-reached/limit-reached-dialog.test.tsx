import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import LimitReachedDialog from "@/components/custom/limit-reached/limit-reached-dialog";
import {
  dismissLimitReached,
  showLimitReached,
} from "@/lib/limits/limit-reached-store";
import { openModalUrl } from "@/lib/modal/modal-navigation";
import { axeDialog } from "@/test/axe-dialog";
import { renderWithProviders } from "@/test/render";

vi.mock("@/lib/modal/modal-navigation", () => ({ openModalUrl: vi.fn() }));

describe("LimitReachedDialog", () => {
  afterEach(() => act(() => dismissLimitReached()));

  it("names the limit in one sentence and has no axe violations", async () => {
    renderWithProviders(<LimitReachedDialog />);
    act(() =>
      showLimitReached({ status: 409, limit: "SHOPPING_LISTS", max: 50 }),
    );

    const dialog = await screen.findByRole("dialog", {
      name: "Nema više mjesta",
    });
    expect(dialog).toHaveTextContent(
      "Možeš imati najviše 50 popisa za kupnju. Ako ti treba više, javi nam se.",
    );
    expect(await axeDialog(document.body)).toHaveNoViolations();
  });

  it.each([
    ["PRODUCT_PHOTOS", 300, "Ukupno možeš dodati najviše 300 slika proizvoda."],
    [
      "PRODUCT_PHOTOS_PER_DAY",
      75,
      "Dnevno možeš dodati najviše 75 slika proizvoda.",
    ],
    [
      "PRODUCT_PHOTOS_PER_PRODUCT",
      3,
      "Za jedan proizvod možeš dodati najviše 3 slike.",
    ],
  ] as const)("names the %s photo limit", async (limit, max, sentence) => {
    renderWithProviders(<LimitReachedDialog />);
    act(() => showLimitReached({ status: 409, limit, max }));

    const dialog = await screen.findByRole("dialog", {
      name: "Nema više mjesta",
    });
    expect(dialog).toHaveTextContent(
      `${sentence} Ako ti treba više, javi nam se.`,
    );
    expect(
      screen.getByRole("button", { name: "Piši podršci" }),
    ).toBeInTheDocument();
  });

  it("opens the contact form from its action", async () => {
    renderWithProviders(<LimitReachedDialog />);
    act(() =>
      showLimitReached({ status: 409, limit: "DIGITAL_CARDS", max: 50 }),
    );

    await userEvent.click(
      await screen.findByRole("button", { name: "Piši podršci" }),
    );

    expect(openModalUrl).toHaveBeenCalledWith({ name: "contact" });
  });
});
