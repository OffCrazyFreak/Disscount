import { useSyncExternalStore, type ReactNode } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { beforeEach, describe, expect, it, vi } from "vitest";

import TouchKeyboardDismissal from "@/components/custom/common/touch-keyboard-dismissal";

const route = vi.hoisted(() => ({
  pathname: "/",
  listeners: new Set<() => void>(),
}));

vi.mock("@/i18n/navigation", () => ({
  usePathname: () =>
    useSyncExternalStore(
      (listener) => {
        route.listeners.add(listener);
        return () => route.listeners.delete(listener);
      },
      () => route.pathname,
    ),
}));

function navigate(pathname: string) {
  act(() => {
    route.pathname = pathname;
    route.listeners.forEach((listener) => listener());
  });
}

function stubPointer(isCoarse: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query === "(pointer: coarse)" ? isCoarse : false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

function NameForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ name: string }>();

  return (
    <form onSubmit={handleSubmit(() => {})}>
      <input
        aria-label="name"
        aria-invalid={Boolean(errors.name)}
        {...register("name", { required: true })}
      />
    </form>
  );
}

function renderWithField(field: ReactNode) {
  render(
    <>
      <TouchKeyboardDismissal />
      {field}
    </>,
  );
}

describe("TouchKeyboardDismissal", () => {
  beforeEach(() => {
    route.pathname = "/";
    stubPointer(true);
  });

  it("closes the keyboard after a form submits", async () => {
    const user = userEvent.setup();
    renderWithField(<NameForm />);
    const field = screen.getByLabelText("name");

    await user.type(field, "mlijeko{Enter}");

    await waitFor(() => expect(field).not.toHaveFocus());
  });

  it("keeps the keyboard up while a field failed validation", async () => {
    const user = userEvent.setup();
    renderWithField(<NameForm />);
    const field = screen.getByLabelText("name");

    await user.click(field);
    await user.keyboard("{Enter}");
    await waitFor(() => expect(field).toHaveAttribute("aria-invalid", "true"));
    await nextFrame();

    expect(field).toHaveFocus();
  });

  it("keeps focus after a submit on a device with a fine pointer", async () => {
    stubPointer(false);
    const user = userEvent.setup();
    renderWithField(<NameForm />);
    const field = screen.getByLabelText("name");

    await user.type(field, "mlijeko{Enter}");
    await nextFrame();

    expect(field).toHaveFocus();
  });

  it("closes the keyboard when the page changes", async () => {
    const user = userEvent.setup();
    renderWithField(<input aria-label="field" />);
    const field = screen.getByLabelText("field");
    await user.click(field);

    navigate("/watchlist");

    expect(field).not.toHaveFocus();
  });

  it("closes the keyboard from a textarea too", async () => {
    const user = userEvent.setup();
    renderWithField(<textarea aria-label="message" />);
    const field = screen.getByLabelText("message");
    await user.click(field);

    navigate("/watchlist");

    expect(field).not.toHaveFocus();
  });

  it("leaves a field in a dialog focused when the page changes", async () => {
    const user = userEvent.setup();
    renderWithField(
      <div role="dialog">
        <input aria-label="title" />
      </div>,
    );
    const field = screen.getByLabelText("title");
    await user.click(field);

    navigate("/shopping-lists");

    expect(field).toHaveFocus();
  });

  it("leaves focus alone on the first render", () => {
    renderWithField(<input aria-label="field" autoFocus />);

    expect(screen.getByLabelText("field")).toHaveFocus();
  });
});
