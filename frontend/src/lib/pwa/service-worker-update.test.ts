import { describe, expect, it, vi } from "vitest";

import { watchServiceWorkerUpdate } from "@/lib/pwa/service-worker-update";

function setup({ isWaitingAtStart = false } = {}) {
  const waitingListeners = new Set<() => void>();
  const controllerListeners: (() => void)[] = [];
  const waitingWorker = { postMessage: vi.fn() };
  const registration = {
    waiting: isWaitingAtStart ? waitingWorker : null,
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
  const onUpdateReady = vi.fn<(applyUpdate: () => Promise<void>) => void>();
  const reload = vi.fn();

  const stop = watchServiceWorkerUpdate({
    serwist: serwist as never,
    serviceWorker: serviceWorker as never,
    onUpdateReady,
    reload,
  });

  return {
    stop,
    reload,
    onUpdateReady,
    waitingWorker,
    registration,
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
    const { stop, onUpdateReady, fireWaiting } = setup({
      isWaitingAtStart: true,
    });

    stop();
    fireWaiting();
    await Promise.resolve();

    expect(onUpdateReady).not.toHaveBeenCalled();
  });
});
