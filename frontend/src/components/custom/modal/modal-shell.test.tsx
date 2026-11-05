import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ConfirmDialog } from "@/components/custom/modal/confirm-dialog";
import { ModalShell } from "@/components/custom/modal/modal-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { axeDialog } from "@/test/axe-dialog";
import { renderWithProviders } from "@/test/render";

describe("modal accessibility", () => {
  it("has no axe violations in a modal with a form field and footer", async () => {
    renderWithProviders(
      <ModalShell
        open
        onOpenChange={vi.fn()}
        title="Rename the list"
        description="The new name shows everywhere."
        onSubmit={vi.fn()}
        submitLabel="Save"
      >
        <Label htmlFor="list-name">Name</Label>
        <Input id="list-name" />
      </ModalShell>,
    );

    expect(
      await screen.findByRole("dialog", { name: "Rename the list" }),
    ).toBeInTheDocument();
    expect(await axeDialog(document.body)).toHaveNoViolations();
  });

  it("has no axe violations in a confirm dialog", async () => {
    renderWithProviders(
      <ConfirmDialog
        isOpen
        onOpenChange={vi.fn()}
        title="Delete the list?"
        description="This cannot be undone."
        variant="destructive"
        onConfirm={vi.fn()}
      />,
    );

    expect(
      await screen.findByRole("dialog", { name: "Delete the list?" }),
    ).toBeInTheDocument();
    expect(await axeDialog(document.body)).toHaveNoViolations();
  });
});
