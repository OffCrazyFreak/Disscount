import { act, screen } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, describe, expect, it } from "vitest";

import ToasterProvider from "@/app/providers/toaster-provider";
import { renderWithProviders } from "@/test/render";

describe("ToasterProvider", () => {
  afterEach(() => {
    act(() => toast.dismiss());
  });

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

  it("paints every toast's action and cancel buttons in the brand tokens", async () => {
    renderWithProviders(<ToasterProvider>{null}</ToasterProvider>);

    act(() => {
      toast("Update ready", {
        action: { label: "Reload", onClick: () => {} },
        cancel: { label: "Later", onClick: () => {} },
      });
    });

    expect(await screen.findByRole("button", { name: "Reload" })).toHaveClass(
      "bg-primary!",
      "text-primary-foreground!",
    );
    expect(screen.getByRole("button", { name: "Later" })).toHaveClass(
      "bg-primary/10!",
      "text-foreground!",
    );
  });

  it("tints success toasts with the brand green instead of sonner's own", async () => {
    renderWithProviders(<ToasterProvider>{null}</ToasterProvider>);

    act(() => {
      toast.success("Saved");
    });

    await screen.findByText("Saved");
    const toaster = document.querySelector<HTMLElement>(
      "[data-sonner-toaster]",
    );

    expect(toaster?.style.getPropertyValue("--success-bg")).toContain(
      "var(--primary)",
    );
    expect(toaster?.style.getPropertyValue("--success-text")).toBe(
      "var(--foreground)",
    );
  });

  it("keeps sonner's own button height instead of stretching the buttons", async () => {
    renderWithProviders(<ToasterProvider>{null}</ToasterProvider>);

    act(() => {
      toast("Update ready", {
        action: { label: "Reload", onClick: () => {} },
        cancel: { label: "Later", onClick: () => {} },
      });
    });

    const reload = await screen.findByRole("button", { name: "Reload" });

    for (const button of [
      reload,
      screen.getByRole("button", { name: "Later" }),
    ]) {
      expect(button.className).not.toMatch(/(^|\s)(min-)?h-/);
    }
  });
});
