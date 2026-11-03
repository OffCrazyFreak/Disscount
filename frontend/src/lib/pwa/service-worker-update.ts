type SerwistWindow = NonNullable<Window["serwist"]>;

interface IServiceWorkerUpdateOptions {
  serwist: Pick<SerwistWindow, "addEventListener" | "removeEventListener">;
  serviceWorker: Pick<
    ServiceWorkerContainer,
    "getRegistration" | "addEventListener"
  >;
  onUpdateReady: (applyUpdate: () => Promise<void>) => void;
  reload: () => void;
}

// The message Serwist's worker listens for when skipWaiting is off.
const SKIP_WAITING_MESSAGE = { type: "SKIP_WAITING" } as const;

/**
 * Calls onUpdateReady whenever a newer service worker is installed and waiting,
 * and hands it the function that activates that worker and reloads the page.
 * Returns a cleanup function.
 */
export function watchServiceWorkerUpdate({
  serwist,
  serviceWorker,
  onUpdateReady,
  reload,
}: IServiceWorkerUpdateOptions): () => void {
  let isDisposed = false;

  async function applyUpdate() {
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
  }

  function handleWaiting() {
    onUpdateReady(applyUpdate);
  }

  serwist.addEventListener("waiting", handleWaiting);

  // A worker left waiting by an earlier visit can finish installing before this
  // listener exists, so its waiting event would be missed.
  void serviceWorker.getRegistration().then((registration) => {
    if (!isDisposed && registration?.waiting) handleWaiting();
  });

  return () => {
    isDisposed = true;
    serwist.removeEventListener("waiting", handleWaiting);
  };
}
