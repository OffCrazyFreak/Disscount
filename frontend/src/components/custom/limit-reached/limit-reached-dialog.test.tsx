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
