import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  updateProductPreferences,
  useProductPreferences,
} from "@/app/[locale]/products/[id]/hooks/use-product-preferences";

const EAN = "5449000000996";

function savePreferences(entry: object) {
  localStorage.setItem(
    "Disscount_app",
    JSON.stringify({ productsPreferences: { [EAN]: entry } }),
  );
}

function PanelsProbe() {
  const { storesOpen = true, isPriceHistoryOpen = false } =
    useProductPreferences(EAN);

  return (
    <p>
      {storesOpen ? "stores open" : "stores closed"},{" "}
      {isPriceHistoryOpen ? "history open" : "history closed"}
    </p>
  );
}

describe("useProductPreferences", () => {
  it("hydrates server HTML without a mismatch, then shows the saved state", async () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(<PanelsProbe />);
    document.body.appendChild(container);
    expect(container.textContent).toBe("stores open, history closed");

    savePreferences({ storesOpen: false, isPriceHistoryOpen: true });
    const onRecoverableError = vi.fn();
    const root = await act(async () =>
      hydrateRoot(container, <PanelsProbe />, { onRecoverableError }),
    );

    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(container.textContent).toBe("stores closed, history open");

    act(() => root.unmount());
    container.remove();
  });

  it("keeps the other panel's saved fields when one panel changes", () => {
    savePreferences({ period: "1M", chains: ["konzum"], storesOpen: true });
    render(<PanelsProbe />);

    act(() => updateProductPreferences(EAN, { isPriceHistoryOpen: true }));

    expect(screen.getByText("stores open, history open")).toBeInTheDocument();
    expect(
      JSON.parse(localStorage.getItem("Disscount_app") ?? "{}")
        .productsPreferences[EAN],
    ).toEqual({
      period: "1M",
      chains: ["konzum"],
      storesOpen: true,
      isPriceHistoryOpen: true,
    });
  });
});
