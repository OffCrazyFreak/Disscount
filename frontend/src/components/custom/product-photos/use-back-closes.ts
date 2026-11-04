import { useEffect, useEffectEvent, useRef } from "react";

const MARKER = "__disscountPhotoViewer";

/**
 * While open, one history entry of ours sits on top, so Back closes the viewer instead of leaving
 * the page. Same marker pattern as openModalUrl: only our flag is passed, so Next re-attaches its own.
 */
export function useBackCloses(open: boolean, close: () => void) {
  // Runs only once our entry is gone, so anything it pushes (the sign-in modal) is not popped with it.
  const afterClose = useRef<(() => void) | null>(null);
  const onPop = useEffectEvent(() => {
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
      afterClose.current = then ?? null;
      window.history.back();
    } else {
      close();
      then?.();
    }
  };
}
