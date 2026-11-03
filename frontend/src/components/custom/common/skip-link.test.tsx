import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import SkipLink, {
  MAIN_CONTENT_ID,
} from "@/components/custom/common/skip-link";
import { renderWithProviders } from "@/test/render";

describe("SkipLink", () => {
  it("links to the main content with the Croatian label", () => {
    renderWithProviders(<SkipLink />);

    expect(
      screen.getByRole("link", { name: "Preskoči na sadržaj" }),
    ).toHaveAttribute("href", `#${MAIN_CONTENT_ID}`);
  });

  it("uses the active locale", () => {
    renderWithProviders(<SkipLink />, { locale: "en" });

    expect(
      screen.getByRole("link", { name: "Skip to main content" }),
    ).toBeInTheDocument();
  });
});
