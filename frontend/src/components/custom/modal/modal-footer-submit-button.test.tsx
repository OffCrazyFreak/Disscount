import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Save } from "lucide-react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ModalFooterSubmitButton from "@/components/custom/modal/modal-footer-submit-button";
import { renderWithProviders } from "@/test/render";

function renderForm({ incomplete = false, disabled = false } = {}) {
  const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());

  renderWithProviders(
    <>
      <form
        id="test-form"
        noValidate
        onSubmit={(e) => onSubmit(e.nativeEvent as SubmitEvent)}
      >
        <input aria-label="Naziv" aria-invalid="true" />
      </form>
      <ModalFooterSubmitButton
        label="Spremi"
        formId="test-form"
        variant="primary"
        icon={Save}
        incomplete={incomplete}
        disabled={disabled}
      />
    </>,
  );

  return onSubmit;
}

const originalScrollIntoView = Element.prototype.scrollIntoView;

afterEach(() => {
  vi.useRealTimers();
  Element.prototype.scrollIntoView = originalScrollIntoView;
});

describe("ModalFooterSubmitButton when the form is incomplete", () => {
  it("stays focusable and submits, so the form can show what is missing", async () => {
    const user = userEvent.setup();
    const onSubmit = renderForm({ incomplete: true });
    const button = screen.getByRole("button", { name: "Spremi" });

    expect(button).toBeEnabled();
    expect(button).toHaveAttribute("aria-disabled", "true");

    await user.click(button);

    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("moves to and reveals the first invalid field", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    window.matchMedia ??= vi.fn().mockReturnValue({ matches: false });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderForm({ incomplete: true });

    await user.click(screen.getByRole("button", { name: "Spremi" }));
    await act(() => vi.runAllTimersAsync());

    expect(screen.getByRole("textbox", { name: "Naziv" })).toHaveFocus();
    expect(scrollIntoView).toHaveBeenCalled();
  });

  it("still blocks the tap when there is nothing to save", () => {
    renderForm({ incomplete: true, disabled: true });

    const button = screen.getByRole("button", { name: "Spremi" });

    expect(button).toBeDisabled();
    expect(button).not.toHaveAttribute("aria-disabled");
  });
});
