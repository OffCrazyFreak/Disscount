import { fireEvent, screen } from "@testing-library/react";
import { Toaster } from "sonner";
import { afterEach, describe, expect, it, vi } from "vitest";

import AppUpdatePrompt from "@/components/custom/pwa/app-update-prompt";
import { renderWithProviders } from "@/test/render";

function stubServiceWorker({ isWaiting = true } = {}) {
  const waitingWorker = { postMessage: vi.fn() };
  const serviceWorker = {
    getRegistration: vi.fn(async () => ({
      waiting: isWaiting ? waitingWorker : null,
    })),
    addEventListener: vi.fn(),
  };
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: serviceWorker,
  });
  window.serwist = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as Window["serwist"];

  return { waitingWorker, serviceWorker };
}

afterEach(() => {
  Reflect.deleteProperty(navigator, "serviceWorker");
  Reflect.deleteProperty(window, "serwist");
});

describe("AppUpdatePrompt", () => {
  it("offers a reload in Croatian and activates the waiting worker on accept", async () => {
    const { waitingWorker, serviceWorker } = stubServiceWorker();

    renderWithProviders(
      <>
        <Toaster />
        <AppUpdatePrompt />
      </>,
    );

    expect(
      await screen.findByText("Dostupna je nova verzija Disscounta."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Kasnije" })).toBeInTheDocument();

    // A plain click: sonner's pointerdown swipe handler needs setPointerCapture, which jsdom lacks.
    fireEvent.click(screen.getByRole("button", { name: "Osvježi" }));

    await vi.waitFor(() =>
      expect(waitingWorker.postMessage).toHaveBeenCalledWith({
        type: "SKIP_WAITING",
      }),
    );
    expect(serviceWorker.addEventListener).toHaveBeenCalledWith(
      "controllerchange",
      expect.any(Function),
      { once: true },
    );
  });

  it("stays silent while no new worker is waiting", async () => {
    const { serviceWorker } = stubServiceWorker({ isWaiting: false });

    renderWithProviders(
      <>
        <Toaster />
        <AppUpdatePrompt />
      </>,
    );

    await vi.waitFor(() =>
      expect(serviceWorker.getRegistration).toHaveBeenCalled(),
    );
    await Promise.resolve();

    expect(
      screen.queryByText("Dostupna je nova verzija Disscounta."),
    ).not.toBeInTheDocument();
  });

  it("stays silent where no service worker is registered", async () => {
    renderWithProviders(
      <>
        <Toaster />
        <AppUpdatePrompt />
      </>,
    );

    await Promise.resolve();

    expect(
      screen.queryByText("Dostupna je nova verzija Disscounta."),
    ).not.toBeInTheDocument();
  });
});
