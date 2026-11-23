import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { useSearchOpener } from "@/app/[locale]/map/hooks/use-search-opener";

function Harness() {
  const [isOpen, setOpen] = useState(false);
  const { inputRef, close, handleKeyDown, fieldProps } = useSearchOpener({
    isOpen,
    onOpenChange: setOpen,
  });

  return (
    <div onKeyDown={handleKeyDown}>
      {isOpen && (
        <button type="button" onClick={(event) => close(event.detail === 0)}>
          back
        </button>
      )}

      {isOpen && (
        <input
          aria-label="dropdown"
          onKeyDown={(event) => {
            if (event.key === "Escape") event.preventDefault();
          }}
        />
      )}

      <div {...fieldProps}>
        <input ref={inputRef} aria-label="field" />
        <button type="button">clear</button>
      </div>

      <p>{isOpen ? "open" : "closed"}</p>
    </div>
  );
}

describe("useSearchOpener", () => {
  it("opens when the field takes focus", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.tab();

    expect(screen.getByLabelText("field")).toHaveFocus();
    expect(screen.getByText("open")).toBeInTheDocument();
  });

  it("stays closed when the clear button is pressed", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "clear" }));

    expect(screen.getByText("closed")).toBeInTheDocument();
  });

  it("closes on Escape and hands focus back to the field", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByLabelText("field"));
    await user.keyboard("{Escape}");

    expect(screen.getByText("closed")).toBeInTheDocument();
    expect(screen.getByLabelText("field")).toHaveFocus();
  });

  it("blurs the field when a tap closes it, so a phone keyboard stays down", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByLabelText("field"));
    await user.click(screen.getByRole("button", { name: "back" }));

    expect(screen.getByText("closed")).toBeInTheDocument();
    expect(screen.getByLabelText("field")).not.toHaveFocus();
  });

  it("leaves Escape to a dropdown inside the panel that handled it", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByLabelText("field"));
    await user.click(screen.getByLabelText("dropdown"));
    await user.keyboard("{Escape}");

    expect(screen.getByText("open")).toBeInTheDocument();
  });
});
