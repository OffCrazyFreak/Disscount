import {
  ModalTarget,
  buildModalSearch,
  stripModalSearch,
} from "@/lib/modal/modal-registry";

export interface IOpenModalOptions {
  // Replaces the current history entry instead of pushing a new one; used for
  // mode/tab switches inside an already-open modal so back still closes it.
  replace?: boolean;
}

// Plain functions (not hooks) reading window.location at call time, so
// open-modal buttons anywhere (header, menus, cards) don't need useSearchParams
// and its Suspense boundary. Shallow pushState/replaceState leave the page
// untouched (no RSC refetch, no scroll reset) while Next syncs useSearchParams,
// which re-renders the ModalRouter.
//
// IMPORTANT: never pass window.history.state through to pushState/replaceState.
// Next's patched history methods treat any state carrying its internal __NA
// flag as one of its OWN navigations and skip the router sync entirely, so
// useSearchParams would never update. Passing only our marker lets Next's
// copyNextJsInternalHistoryState re-attach its internals AND fire the sync.

function hasModalMarker(): boolean {
  return !!window.history.state?.__disscountModal;
}

export function openModalUrl(
  target: ModalTarget,
  options?: IOpenModalOptions,
): void {
  const current = new URLSearchParams(window.location.search);
  const url =
    window.location.pathname +
    buildModalSearch(current, target) +
    window.location.hash;

  if (options?.replace) {
    // Keep the marker if this entry was pushed by us (tab/mode swaps).
    const state = hasModalMarker() ? { __disscountModal: true } : {};
    window.history.replaceState(state, "", url);
  } else {
    // The marker records that we pushed this entry ourselves, letting
    // closeModalUrl use history.back() so the browser back button and the
    // X button behave identically.
    window.history.pushState({ __disscountModal: true }, "", url);
  }
}

export function closeModalUrl(): void {
  if (hasModalMarker()) {
    window.history.back();
  } else {
    // Deep link or hard refresh landed directly on ?modal=...: there is no
    // history entry of ours to pop, so strip the params in place instead.
    const current = new URLSearchParams(window.location.search);
    const url =
      window.location.pathname +
      stripModalSearch(current) +
      window.location.hash;
    window.history.replaceState({}, "", url);
  }
}

export function swapModalUrl(target: ModalTarget): void {
  openModalUrl(target, { replace: true });
}
