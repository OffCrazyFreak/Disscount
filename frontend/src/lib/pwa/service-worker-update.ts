type SerwistWindow = NonNullable<Window["serwist"]>;

interface IServiceWorkerUpdateOptions {
  serwist: Pick<SerwistWindow, "addEventListener" | "removeEventListener">;
  serviceWorker: Pick<
    ServiceWorkerContainer,
    "getRegistration" | "addEventListener"
  >;
  visibility: Pick<
    Document,
    "visibilityState" | "addEventListener" | "removeEventListener"
  >;
  onUpdateReady: (applyUpdate: () => Promise<void>) => void;
  reload: () => void;
}

// The message Serwist's worker listens for when skipWaiting is off.
const SKIP_WAITING_MESSAGE = { type: "SKIP_WAITING" } as const;

export function watchServiceWorkerUpdate({
  serwist,
  serviceWorker,
  visibility,
  onUpdateReady,
  reload,
}: IServiceWorkerUpdateOptions): () => void {
  let isDisposed = false;

  async function applyUpdate() {
    try {
      const registration = await serviceWorker.getRegistration();
      const waitingWorker = registration?.waiting;

      // Another tab may have activated it already; a reload then gets the new version.
      if (!waitingWorker) {
        reload();
        return;
      }

      serviceWorker.addEventListener("controllerchange", () => reload(), {
        once: true,
      });
      waitingWorker.postMessage(SKIP_WAITING_MESSAGE);
    } catch {
      reload();
    }
  }

  // Client navigations fetch no document, so the browser never looks for a new worker while the tab stays open.
  function checkForUpdate() {
    if (visibility.visibilityState !== "visible") return;

    serviceWorker
      .getRegistration()
      .then((registration) => registration?.update())
      .catch(() => {
        // Offline or the script failed to fetch; the next check retries.
      });
  }

  function handleWaiting() {
    onUpdateReady(applyUpdate);
  }

  serwist.addEventListener("waiting", handleWaiting);
  visibility.addEventListener("visibilitychange", checkForUpdate);

  // A worker left waiting by an earlier visit can finish installing before this listener exists, missing its waiting event.
  void serviceWorker.getRegistration().then((registration) => {
    if (!isDisposed && registration?.waiting) handleWaiting();
  });

  return () => {
    isDisposed = true;
    serwist.removeEventListener("waiting", handleWaiting);
    visibility.removeEventListener("visibilitychange", checkForUpdate);
  };
}
