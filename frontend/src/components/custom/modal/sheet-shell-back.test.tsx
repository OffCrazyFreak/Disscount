import { useState } from "react";
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SheetShell from "@/components/custom/modal/sheet-shell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { renderWithProviders } from "@/test/render";

// Base UI reads the platform once at import and registers its watcher only on Android, so both must exist before the drawer loads.
const watchers = vi.hoisted(() => {
  // Mirrors the browser: a vetoable cancel, then destroy, then close.
  class FakeCloseWatcher extends EventTarget {
    static instances: FakeCloseWatcher[] = [];
    isDestroyed = false;

    constructor() {
      super();
      FakeCloseWatcher.instances.push(this);
    }

    destroy() {
      this.isDestroyed = true;
    }

    requestClose(cancelable = true) {
      if (this.isDestroyed) return;

      const isAllowed = this.dispatchEvent(new Event("cancel", { cancelable }));
      if (!isAllowed) return;

      this.isDestroyed = true;
      this.dispatchEvent(new Event("close"));
    }
  }

  Object.defineProperty(window.navigator, "userAgent", {
    value: "Mozilla/5.0 (Linux; Android 15) Chrome/140.0 Mobile",
    configurable: true,
  });
  Object.defineProperty(window, "CloseWatcher", {
    value: FakeCloseWatcher,
    configurable: true,
  });

  return FakeCloseWatcher;
});

function pressBack(cancelable = true) {
  const live = watchers.instances.filter((watcher) => !watcher.isDestroyed);

  act(() => live.at(-1)?.requestClose(cancelable));
}

function Harness() {
  const [isSheetOpen, setSheetOpen] = useState(true);
  const [isDialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setDialogOpen(true)}>
        open dialog
      </button>

      <SheetShell
        open={isSheetOpen}
        onOpenChange={setSheetOpen}
        title="sheet"
        modal={false}
      >
        <p>search</p>
      </SheetShell>

      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogTitle>dialog</DialogTitle>
          <DialogDescription>over the sheet</DialogDescription>
        </DialogContent>
      </Dialog>
    </>
  );
}

describe("SheetShell on Android back", () => {
  beforeEach(() => {
    watchers.instances.length = 0;
  });

  // Radix dialogs register no close watcher, so the sheet's older one would take the gesture and close the layer underneath.
  it("closes a Radix dialog over a non-modal sheet before the sheet", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    await screen.findByText("search");
    await user.click(screen.getByRole("button", { name: "open dialog" }));
    await screen.findByRole("dialog", { name: "dialog" });

    pressBack();

    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "dialog" }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByText("search")).toBeInTheDocument();

    pressBack();

    await waitFor(() =>
      expect(screen.queryByText("search")).not.toBeInTheDocument(),
    );
  });

  it("closes the sheet when nothing sits above it", async () => {
    renderWithProviders(<Harness />);
    await screen.findByText("search");

    pressBack();

    await waitFor(() =>
      expect(screen.queryByText("search")).not.toBeInTheDocument(),
    );
  });

  // Past one veto per user activation the browser closes regardless, so the sheet goes and the dialog is left for the next back.
  it("closes the sheet when the browser will not let the close be vetoed", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    await screen.findByText("search");
    await user.click(screen.getByRole("button", { name: "open dialog" }));
    await screen.findByRole("dialog", { name: "dialog" });

    pressBack(false);

    await waitFor(() =>
      expect(screen.queryByText("search")).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("dialog", { name: "dialog" })).toBeInTheDocument();
  });
});
