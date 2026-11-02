import { useRef, useState } from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SheetShell from "@/components/custom/modal/sheet-shell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { renderWithProviders } from "@/test/render";

interface IHarnessProps {
  modal?: boolean;
  withDialog?: boolean;
  /** Close the sheet as the dialog opens, which is what the quick actions do */
  swapsToDialog?: boolean;
  /** A Radix menu inside the sheet, like the mobile sidebar's language switcher */
  withMenu?: boolean;
}

function Harness({
  modal,
  withDialog = false,
  swapsToDialog = false,
  withMenu = false,
}: IHarnessProps) {
  const [isOpen, setOpen] = useState(false);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const fieldRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        open sheet
      </button>
      <button type="button">page control</button>

      <SheetShell
        open={isOpen}
        onOpenChange={setOpen}
        title="sheet"
        modal={modal}
        initialFocusRef={fieldRef}
      >
        <input ref={fieldRef} aria-label="sheet field" />

        {withMenu && (
          <DropdownMenu>
            <DropdownMenuTrigger>language</DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>English</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {withDialog && (
          <button
            type="button"
            onClick={() => {
              if (swapsToDialog) setOpen(false);
              setDialogOpen(true);
            }}
          >
            open dialog
          </button>
        )}
      </SheetShell>

      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogTitle>dialog</DialogTitle>
          <DialogDescription>over the sheet</DialogDescription>
          <input aria-label="dialog field" />
        </DialogContent>
      </Dialog>
    </>
  );
}

describe("SheetShell", () => {
  // jsdom has no ResizeObserver; the body's scroll fades are all it drives.
  beforeEach(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  // #134: vaul never told Radix the sheet was non-modal, so the page behind was
  // aria-hidden and Tab was trapped inside the sheet.
  it("leaves the page reachable while a non-modal sheet is open", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness modal={false} />);

    await user.click(screen.getByRole("button", { name: "open sheet" }));
    const field = await screen.findByRole("textbox", { name: "sheet field" });
    await waitFor(() => expect(field).toHaveFocus());

    const pageControl = screen.getByRole("button", { name: "page control" });
    expect(pageControl.closest("[aria-hidden='true'], [inert]")).toBeNull();

    await user.click(pageControl);
    expect(pageControl).toHaveFocus();
    expect(screen.getByRole("dialog", { name: "sheet" })).toBeInTheDocument();
  });

  it("traps a modal sheet, closes on Escape and hands focus back", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    const opener = screen.getByRole("button", { name: "open sheet" });
    await user.click(opener);
    const field = await screen.findByRole("textbox", { name: "sheet field" });
    await waitFor(() => expect(field).toHaveFocus());

    expect(
      screen.queryByRole("button", { name: "page control" }),
    ).not.toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "sheet" }),
      ).not.toBeInTheDocument(),
    );
    expect(opener).toHaveFocus();
  });

  // Product quick actions open a Radix dialog from inside the sheet, so the two
  // focus managers must not fight over the focus.
  it("lets a Radix dialog opened from the sheet keep the focus", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness withDialog />);

    await user.click(screen.getByRole("button", { name: "open sheet" }));
    await user.click(
      await screen.findByRole("button", { name: "open dialog" }),
    );

    const dialogField = await screen.findByRole("textbox", {
      name: "dialog field",
    });
    await user.click(dialogField);
    await user.keyboard("mlijeko");

    expect(dialogField).toHaveFocus();
    expect(dialogField).toHaveValue("mlijeko");

    // Radix and Base UI keep separate Escape stacks, so only the top one closes.
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(
        screen.queryByRole("textbox", { name: "dialog field" }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("dialog", { name: "sheet" })).toBeInTheDocument();
  });

  it("leaves the focus in a dialog that replaces the closing sheet", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness withDialog swapsToDialog />);

    await user.click(screen.getByRole("button", { name: "open sheet" }));
    await user.click(
      await screen.findByRole("button", { name: "open dialog" }),
    );

    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "sheet" }),
      ).not.toBeInTheDocument(),
    );
    const dialog = screen.getByRole("dialog", { name: "dialog" });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });

  // A modal Radix menu sets pointer-events: none on the body, which the scrim
  // inherits, so the press meant to close the menu lands on <html>.
  it("closes only a Radix menu when its outside press lands on the scrim", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderWithProviders(<Harness withMenu />);

    await user.click(screen.getByRole("button", { name: "open sheet" }));
    await user.click(await screen.findByRole("button", { name: "language" }));
    expect(await screen.findByRole("menu")).toBeInTheDocument();

    // jsdom does no hit testing, so press where the browser would land.
    await user.click(document.documentElement);

    await waitFor(() =>
      expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("dialog", { name: "sheet" })).toBeInTheDocument();
  });
});
