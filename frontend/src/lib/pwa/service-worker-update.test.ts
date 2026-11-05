import { describe, expect, it, vi } from "vitest";

import { watchServiceWorkerUpdate } from "@/lib/pwa/service-worker-update";

function setup({ isWaitingAtStart = false } = {}) {
  const waitingListeners = new Set<() => void>();
  const controllerListeners: (() => void)[] = [];
  const visibilityListeners = new Set<() => void>();
  const waitingWorker = { postMessage: vi.fn() };
  const registration = {
    waiting: isWaitingAtStart ? waitingWorker : null,
    update: vi.fn(async () => undefined),
  } as unknown as ServiceWorkerRegistration;

  const serwist = {
    addEventListener: vi.fn((_type: string, listener: () => void) => {
      waitingListeners.add(listener);
    }),
    removeEventListener: vi.fn((_type: string, listener: () => void) => {
      waitingListeners.delete(listener);
    }),
  };
  const serviceWorker = {
    getRegistration: vi.fn(async () => registration),
    addEventListener: vi.fn((_type: string, listener: () => void) => {
      controllerListeners.push(listener);
    }),
  };
  const visibility = {
    visibilityState: "visible" as DocumentVisibilityState,
    addEventListener: vi.fn((_type: string, listener: () => void) => {
      visibilityListeners.add(listener);
    }),
    removeEventListener: vi.fn((_type: string, listener: () => void) => {
      visibilityListeners.delete(listener);
    }),
  };
  const onUpdateReady = vi.fn<(applyUpdate: () => Promise<void>) => void>();
  const reload = vi.fn();

  const stop = watchServiceWorkerUpdate({
    serwist: serwist as never,
    serviceWorker: serviceWorker as never,
    visibility: visibility as never,
    onUpdateReady,
    reload,
  });

  return {
    stop,
    reload,
    onUpdateReady,
    waitingWorker,
    registration,
    serviceWorker,
    visibility,
    showTab(state: DocumentVisibilityState) {
      visibility.visibilityState = state;
      visibilityListeners.forEach((listener) => listener());
    },
    fireWaiting() {
      (registration as { waiting: unknown }).waiting = waitingWorker;
      waitingListeners.forEach((listener) => listener());
    },
    takeControl() {
      controllerListeners.forEach((listener) => listener());
    },
  };
}

function applyUpdateFrom(
  onUpdateReady: ReturnType<typeof setup>["onUpdateReady"],
) {
  return onUpdateReady.mock.calls[0][0];
}

describe("watchServiceWorkerUpdate", () => {
  it("offers the update when a new worker starts waiting", async () => {
    const { onUpdateReady, fireWaiting } = setup();
    await Promise.resolve();
    expect(onUpdateReady).not.toHaveBeenCalled();

    fireWaiting();

    expect(onUpdateReady).toHaveBeenCalledOnce();
  });

  it("offers a worker that was already waiting before it subscribed", async () => {
    const { onUpdateReady } = setup({ isWaitingAtStart: true });

    await vi.waitFor(() => expect(onUpdateReady).toHaveBeenCalledOnce());
  });

  it("activates the waiting worker and reloads only once it has control", async () => {
    const { onUpdateReady, fireWaiting, waitingWorker, takeControl, reload } =
      setup();
    fireWaiting();

    await applyUpdateFrom(onUpdateReady)();

    expect(waitingWorker.postMessage).toHaveBeenCalledWith({
      type: "SKIP_WAITING",
    });
    expect(reload).not.toHaveBeenCalled();

    takeControl();

    expect(reload).toHaveBeenCalledOnce();
  });

  it("reloads straight away when another tab already activated the worker", async () => {
    const { onUpdateReady, fireWaiting, registration, waitingWorker, reload } =
      setup();
    fireWaiting();
    (registration as { waiting: unknown }).waiting = null;

    await applyUpdateFrom(onUpdateReady)();

    expect(waitingWorker.postMessage).not.toHaveBeenCalled();
    expect(reload).toHaveBeenCalledOnce();
  });

  it("stops offering after cleanup, including the pending startup check", async () => {
    const { stop, onUpdateReady, fireWaiting, showTab, registration } = setup({
      isWaitingAtStart: true,
    });

    stop();
    fireWaiting();
    showTab("visible");
    await Promise.resolve();

    expect(onUpdateReady).not.toHaveBeenCalled();
    expect(registration.update).not.toHaveBeenCalled();
  });

  it("looks for a new worker each time the tab comes back into view", async () => {
    const { showTab, registration } = setup();

    showTab("hidden");
    showTab("visible");

    await vi.waitFor(() => expect(registration.update).toHaveBeenCalledOnce());
  });

  it("reloads when activating the update fails, rather than doing nothing", async () => {
    const { onUpdateReady, fireWaiting, serviceWorker, reload } = setup();
    fireWaiting();
    serviceWorker.getRegistration.mockRejectedValueOnce(new Error("gone"));

    await applyUpdateFrom(onUpdateReady)();

    expect(reload).toHaveBeenCalledOnce();
  });
});
