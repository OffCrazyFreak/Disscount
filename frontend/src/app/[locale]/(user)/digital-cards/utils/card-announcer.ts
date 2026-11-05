type Listener = () => void;

let message = "";
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeAnnouncer(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAnnouncement() {
  return message;
}

// Cleared after a moment so the same sentence twice in a row is announced twice.
export function announceCard(next: string) {
  message = next;
  emit();

  clearTimeout(timer);
  timer = setTimeout(() => {
    message = "";
    emit();
  }, 1500);
}

export function pinAnnouncementKey(pinned: boolean) {
  return pinned ? "announce.pinned" : "announce.unpinned";
}

export function archiveAnnouncementKey(archived: boolean) {
  return archived ? "announce.archived" : "announce.unarchived";
}

// Pinning moves a tile to another grid, which remounts it; the new button reads this to
// take focus back.
let pendingFocusId: string | null = null;
let focusTimer: ReturnType<typeof setTimeout> | undefined;

// Expires, so a tile that never remounted cannot grab focus on some later visit.
export function requestPinFocus(cardId: string) {
  pendingFocusId = cardId;

  clearTimeout(focusTimer);
  focusTimer = setTimeout(() => {
    pendingFocusId = null;
  }, 1000);
}

export function takePinFocus(cardId: string): boolean {
  if (pendingFocusId !== cardId) return false;

  pendingFocusId = null;
  return true;
}

export function pinButtonId(cardId: string) {
  return `pin-card-${cardId}`;
}
