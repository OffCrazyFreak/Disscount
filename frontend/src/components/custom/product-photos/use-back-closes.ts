import { useEffect, useEffectEvent, useRef } from "react";

const MARKER = "__disscountPhotoViewer";

/** Our history entry makes Back close the viewer; only our flag is passed, so Next adds its own. */
export function useBackCloses(open: boolean, close: () => void) {
  // Runs only once our entry is gone, so anything it pushes (the sign-in modal) is not popped with it.
  const afterClose = useRef<(() => void) | null>(null);
  const isClosing = useRef(false);
  const onPop = useEffectEvent(() => {
    isClosing.current = false;
    close();
    afterClose.current?.();
    afterClose.current = null;
  });

  useEffect(() => {
    if (!open) return;
    window.history.pushState({ [MARKER]: true }, "", window.location.href);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [open]);

  return function requestClose(then?: () => void) {
    if (window.history.state?.[MARKER]) {
      // A second tap before the pop lands would step Back again, past the page.
      if (isClosing.current) return;
      isClosing.current = true;
      afterClose.current = then ?? null;
      window.history.back();
    } else {
      close();
      then?.();
    }
  };
}
