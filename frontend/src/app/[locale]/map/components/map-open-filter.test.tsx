import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import MapOpenFilter from "@/app/[locale]/map/components/map-open-filter";
import type { OpenFilter } from "@/app/[locale]/map/utils/open-filter";
import { renderWithProviders } from "@/test/render";

const FAILED =
  "Radno vrijeme se nije učitalo, pa ne možemo izdvojiti otvorene trgovine.";

function setup(filter: OpenFilter, hasHoursFailed: boolean) {
  const onRetry = vi.fn();
  renderWithProviders(
    <MapOpenFilter
      filter={filter}
      onChange={() => {}}
      hasHoursFailed={hasHoursFailed}
      onRetry={onRetry}
    />,
  );
  return onRetry;
}

describe("MapOpenFilter", () => {
  it("says the filter cannot work when the hours failed, and retries", async () => {
    const onRetry = setup("confirmed", true);

    expect(screen.getByRole("status")).toHaveTextContent(FAILED);

    await userEvent.click(
      screen.getByRole("button", { name: "Pokušaj ponovno" }),
    );
    expect(onRetry).toHaveBeenCalled();
  });

  it("stays quiet while the filter is off", () => {
    setup("off", true);

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("stays quiet once the hours are in", () => {
    setup("confirmed", false);

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});
