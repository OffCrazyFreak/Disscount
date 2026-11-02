import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ToasterProvider from "@/app/providers/toaster-provider";
import { renderWithProviders } from "@/test/render";

describe("ToasterProvider", () => {
  it("names the toast region in Croatian and keeps the alt+T hint", () => {
    renderWithProviders(<ToasterProvider>{null}</ToasterProvider>);

    expect(
      screen.getByRole("region", { name: "Poruke alt+T" }),
    ).toBeInTheDocument();
  });

  it("names the toast region in the active locale", () => {
    renderWithProviders(<ToasterProvider>{null}</ToasterProvider>, {
      locale: "en",
    });

    expect(
      screen.getByRole("region", { name: "Messages alt+T" }),
    ).toBeInTheDocument();
  });
});
