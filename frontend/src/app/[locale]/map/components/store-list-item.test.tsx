import { useState } from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import StoreListItem from "@/app/[locale]/map/components/store-list-item";
import { toListedStore } from "@/app/[locale]/map/hooks/use-visible-stores";
import { DirectoryStoreDto } from "@/lib/api/schemas";
import { renderWithProviders } from "@/test/render";

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
    expect(screen.queryByText("Ilica 1, 10000 Zagreb")).not.toBeInTheDocument();

    await user.click(trigger);

    expect(onSelect).toHaveBeenLastCalledWith("konzum:123");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Ilica 1, 10000 Zagreb")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Upute \(Google karte\)/ }),
    ).toBeInTheDocument();

    await user.click(trigger);

    expect(onSelect).toHaveBeenLastCalledWith(null);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("starts open when the store is already selected on the map", () => {
    renderWithProviders(
      <StoreListItem row={row} isSelected onSelect={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: /Ilica 1/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByText("Ilica 1, 10000 Zagreb")).toBeInTheDocument();
  });
});
