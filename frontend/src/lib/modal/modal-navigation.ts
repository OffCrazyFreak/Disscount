import {
  ModalTarget,
  buildModalSearch,
  stripModalSearch,
} from "@/lib/modal/modal-registry";

export interface OpenModalOptions {
  // Replaces the current history entry instead of pushing a new one; used for
  // mode/tab switches inside an already-open modal so back still closes it.
  replace?: boolean;
}

// Plain functions (not hooks) reading window.location at call time, so
// open-modal buttons anywhere (header, menus, cards) don't need useSearchParams
// and its Suspense boundary. Shallow pushState/replaceState leave the page
// untouched (no RSC refetch, no scroll reset) while Next syncs useSearchParams,
// which re-renders the ModalRouter.

export function openModalUrl(
  target: ModalTarget,
  options?: OpenModalOptions
): void {
  const current = new URLSearchParams(window.location.search);
  const url = window.location.pathname + buildModalSearch(current, target);

  if (options?.replace) {
    window.history.replaceState(window.history.state, "", url);
  } else {
    // The marker records that we pushed this entry ourselves, letting
    // closeModalUrl use history.back() so the browser back button and the
    // X button behave identically.
    window.history.pushState(
      { ...window.history.state, __disscountModal: true },
      "",
      url
    );
  }
}

export function closeModalUrl(): void {
  if (window.history.state?.__disscountModal) {
    window.history.back();
  } else {
    // Deep link or hard refresh landed directly on ?modal=...: there is no
    // history entry of ours to pop, so strip the params in place instead.
    const current = new URLSearchParams(window.location.search);
    const url = window.location.pathname + stripModalSearch(current);
    window.history.replaceState(window.history.state, "", url);
  }
}

export function swapModalUrl(target: ModalTarget): void {
  openModalUrl(target, { replace: true });
}
