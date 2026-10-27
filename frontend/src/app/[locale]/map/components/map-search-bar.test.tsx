import { useState } from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import MapSearchBar from "@/app/[locale]/map/components/map-search-bar";
import { renderWithProviders } from "@/test/render";

// The bar's own behaviour is under test, not the session, sidebar or URL search.
vi.mock("@/components/custom/header/components/header-actions", () => ({
  default: () => <button type="button">avatar</button>,
}));
vi.mock("@/components/ui/sidebar", () => ({
  SidebarTrigger: () => <button type="button">menu</button>,
}));
vi.mock("@/app/[locale]/map/components/map-search", () => ({
  default: ({ inputRef }: { inputRef: React.Ref<HTMLInputElement> }) => (
    <input aria-label="search" ref={inputRef} />
  ),
}));

function Harness({ onOuterEscape }: { onOuterEscape: () => void }) {
  const [isOpen, setOpen] = useState(false);

  return (
    <div
      onKeyDown={(event) => {
        if (event.key === "Escape") onOuterEscape();
      }}
    >
      <MapSearchBar isOpen={isOpen} onOpenChange={setOpen}>
        <p>store list</p>
      </MapSearchBar>
    </div>
  );
}

describe("MapSearchBar", () => {
  it("opens on a press of the field, and the back arrow closes it", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness onOuterEscape={vi.fn()} />);

    expect(screen.queryByText("store list")).not.toBeInTheDocument();

    await user.click(screen.getByRole("textbox", { name: "search" }));
    expect(await screen.findByText("store list")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "menu" })).toBeNull(),
    );

    await user.click(screen.getByRole("button", { name: "Natrag na kartu" }));
    expect(screen.getByRole("textbox", { name: "search" })).not.toHaveFocus();
    expect(
      await screen.findByRole("button", { name: "menu" }),
    ).toBeInTheDocument();
  });

  it("keeps Escape to itself, so an open store sheet stays open", async () => {
    const onOuterEscape = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<Harness onOuterEscape={onOuterEscape} />);

    const field = screen.getByRole("textbox", { name: "search" });
    await user.click(field);
    fireEvent.keyDown(field, { key: "Escape" });

    expect(onOuterEscape).not.toHaveBeenCalled();
    expect(
      await screen.findByRole("button", { name: "menu" }),
    ).toBeInTheDocument();
  });

  it("hands focus back to the field when a key closes it", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness onOuterEscape={vi.fn()} />);

    const field = screen.getByRole("textbox", { name: "search" });
    await user.click(field);
    await screen.findByText("store list");

    screen.getByRole("button", { name: "Natrag na kartu" }).focus();
    await user.keyboard("{Enter}");

    await waitFor(() =>
      expect(screen.queryByText("store list")).not.toBeInTheDocument(),
    );
    expect(field).toHaveFocus();
  });
});
