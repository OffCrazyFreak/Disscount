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

function ChartProbe() {
  const { period = "1W", chains = [] } = useProductPreferences(EAN);

  return (
    <p>
      {period}, {chains.length > 0 ? chains.join("+") : "all chains"}
    </p>
  );
}

describe("useProductPreferences", () => {
  it("hydrates server HTML without a mismatch, then shows the saved state", async () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(<ChartProbe />);
    document.body.appendChild(container);
    expect(container.textContent).toBe("1W, all chains");

    savePreferences({ period: "1M", chains: ["konzum"] });
    const onRecoverableError = vi.fn();
    const root = await act(async () =>
      hydrateRoot(container, <ChartProbe />, { onRecoverableError }),
    );

    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(container.textContent).toBe("1M, konzum");

    act(() => root.unmount());
    container.remove();
  });

  it("keeps the other saved fields when one field changes", () => {
    savePreferences({ period: "1M", chains: ["konzum"] });
    render(<ChartProbe />);

    act(() => updateProductPreferences(EAN, { period: "1Y" }));

    expect(screen.getByText("1Y, konzum")).toBeInTheDocument();
    expect(
      JSON.parse(localStorage.getItem("Disscount_app") ?? "{}")
        .productsPreferences[EAN],
    ).toEqual({
      period: "1Y",
      chains: ["konzum"],
    });
  });
});
