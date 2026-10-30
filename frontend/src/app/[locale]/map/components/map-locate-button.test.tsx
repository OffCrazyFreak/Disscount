import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";

import MapLocateButton from "@/app/[locale]/map/components/map-locate-button";
import { renderWithProviders } from "@/test/render";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

describe("MapLocateButton", () => {
  it("explains every failed tap, even when the status stays the same", async () => {
    const user = userEvent.setup();
    // A browser without geolocation answers each tap with "unavailable" again.
    renderWithProviders(
      <MapLocateButton status="unavailable" onLocate={() => {}} />,
    );

    const button = screen.getByRole("button", { name: "Trgovine blizu mene" });
    await user.click(button);
    await user.click(button);

    expect(toast.error).toHaveBeenCalledTimes(2);
  });

  it("says nothing about a failure this button did not ask for", () => {
    renderWithProviders(
      <MapLocateButton status="denied" onLocate={() => {}} />,
    );

    expect(toast.error).not.toHaveBeenCalled();
  });
});
