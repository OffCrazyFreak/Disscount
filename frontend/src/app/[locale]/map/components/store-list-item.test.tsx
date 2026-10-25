import { useState } from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import StoreListItem from "@/app/[locale]/map/components/store-list-item";
import { toListedStore } from "@/app/[locale]/map/hooks/use-visible-stores";
import { DirectoryStoreDto } from "@/lib/api/schemas";
import { renderWithProviders } from "@/test/render";
import { shareOrCopy } from "@/utils/browser/share";

vi.mock("@/utils/browser/share", () => ({
  shareOrCopy: vi.fn(async () => "shared"),
}));

const store: DirectoryStoreDto = {
  chain: "konzum",
  code: "123",
  type: null,
  address: "Ilica 1",
  city: "Zagreb",
  zipcode: "10000",
  phone: null,
  lat: 45.81,
  lon: 15.97,
  locationSource: "upstream",
};

const row = toListedStore(store, null);

interface IControlledItemProps {
  onSelect: (key: string | null) => void;
}

function ControlledItem({ onSelect }: IControlledItemProps) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <StoreListItem
      row={row}
      isSelected={selected === row.key}
      onSelect={(key) => {
        onSelect(key);
        setSelected(key);
      }}
    />
  );
}

describe("StoreListItem", () => {
  it("opens in place to show the details, and closes again", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<ControlledItem onSelect={onSelect} />);

    const trigger = screen.getByRole("button", { name: /Ilica 1/ });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("link", { name: /Upute \(Google karte\)/ }),
    ).not.toBeInTheDocument();

    await user.click(trigger);

    expect(onSelect).toHaveBeenLastCalledWith("konzum:123");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("link", { name: /Upute \(Google karte\)/ }),
    ).toBeInTheDocument();

    await user.click(trigger);

    expect(onSelect).toHaveBeenLastCalledWith(null);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("shares from the open row's address line without closing the row", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<ControlledItem onSelect={onSelect} />);

    expect(
      screen.queryByRole("button", { name: "Podijeli" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Ilica 1/ }));
    await user.click(screen.getByRole("button", { name: "Podijeli" }));

    expect(shareOrCopy).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: /Ilica 1/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("starts open when the store is already selected on the map", () => {
    renderWithProviders(
      <StoreListItem row={row} isSelected onSelect={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: /Ilica 1/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("cuts long lines short while closed and shows them whole once open", () => {
    const { rerender } = renderWithProviders(
      <StoreListItem row={row} isSelected={false} onSelect={vi.fn()} />,
    );

    const name = () => screen.getByText("Konzum");
    const address = () =>
      screen.getByText("Ilica 1, 10000 Zagreb").closest(".block");
    expect(name()).toHaveClass("truncate");
    expect(address()).toHaveClass("truncate");

    rerender(<StoreListItem row={row} isSelected onSelect={vi.fn()} />);

    expect(name()).not.toHaveClass("truncate");
    expect(address()).not.toHaveClass("truncate");
    // The open panel no longer repeats what the row already says.
    expect(screen.getAllByText("Ilica 1, 10000 Zagreb")).toHaveLength(1);
  });

  it("marks a store with no pin outside the line an ellipsis can cut", () => {
    const unplaced = toListedStore({ ...store, lat: null, lon: null }, null);
    renderWithProviders(
      <StoreListItem row={unplaced} isSelected={false} onSelect={vi.fn()} />,
    );

    const label = screen.getByText("bez lokacije");
    expect(label.closest(".truncate")).toBeNull();
  });
});
