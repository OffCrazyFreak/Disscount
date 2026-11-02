import { useEffect, useEffectEvent } from "react";

const MARKER = "__disscountPhotoViewer";

/**
 * While open, one history entry of ours sits on top, so Back closes the viewer instead of leaving
 * the page. Same marker pattern as openModalUrl: only our flag is passed, so Next re-attaches its own.
 */
export function useBackCloses(open: boolean, close: () => void) {
  const onPop = useEffectEvent(() => close());

  useEffect(() => {
    if (!open) return;
    window.history.pushState({ [MARKER]: true }, "", window.location.href);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [open]);

  return function requestClose() {
    if (window.history.state?.[MARKER]) {
      window.history.back();
    } else {
      close();
    }
  };
}
