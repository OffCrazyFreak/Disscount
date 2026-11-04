import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ShoppingListTrigger from "@/app/[locale]/products/components/forms/shopping-list-trigger";
import type { ShoppingListDto } from "@/lib/api/types";
import { renderWithProviders } from "@/test/render";

const LIST: ShoppingListDto = {
  id: "5b0e6c1a-7d2f-4e8a-9c3b-1f4d6a8e2c70",
  title: "Tjedna kupnja",
  ownerId: "user-a",
  linkAccess: null,
  myAccess: "OWNER",
  updatedAt: "2026-11-01T10:00:00",
  createdAt: "2026-11-01T09:00:00",
  items: [],
};

function renderTrigger(
  overrides: Partial<Parameters<typeof ShoppingListTrigger>[0]> = {},
) {
  return renderWithProviders(
    <ShoppingListTrigger
      open={false}
      isLoadingLists={false}
      hasShoppingLists
      isNewList={false}
      customListTitle=""
      selectedList={undefined}
      {...overrides}
    />,
  );
}

// jsdom has no layout, so these pin the classes that make a cut label end in an ellipsis.
describe("ShoppingListTrigger truncation", () => {
  it("lets the choose prompt end in an ellipsis", () => {
    renderTrigger();

    expect(screen.getByText("Odaberi popis")).toHaveClass("truncate");
  });

  it("lets the create-first prompt end in an ellipsis", () => {
    renderTrigger({ hasShoppingLists: false });

    expect(screen.getByText("Stvori prvi popis")).toHaveClass("truncate");
  });

  it("keeps a long new list name ending in an ellipsis", () => {
    renderTrigger({ isNewList: true, customListTitle: "Vikend" });

    expect(screen.getByText(/Vikend/)).toHaveClass("truncate");
  });

  it("shrinks the title and the date but keeps the progress whole", () => {
    renderTrigger({ selectedList: LIST });

    expect(screen.getByText("Tjedna kupnja")).toHaveClass("truncate");
    expect(screen.getByText("(01.11.2026.)")).toHaveClass(
      "min-w-0",
      "truncate",
    );
    expect(screen.getByText("0/0")).toHaveClass("shrink-0");
  });
});
