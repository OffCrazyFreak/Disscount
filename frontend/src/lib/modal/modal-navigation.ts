import {
  ModalTarget,
  buildModalSearch,
  stripModalSearch,
} from "@/lib/modal/modal-registry";

export interface IOpenModalOptions {
  // For tab switches inside an open modal, so back still closes it.
  replace?: boolean;
}

// Never forward window.history.state: Next skips its router sync on its own __NA flag.

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
    // The marker lets closeModalUrl use history.back(), so back and X match.
    window.history.pushState({ __disscountModal: true }, "", url);
  }
}

export function closeModalUrl(): void {
  if (hasModalMarker()) {
    window.history.back();
  } else {
    // Landed here directly, so there is no entry of ours to pop; strip in place.
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
