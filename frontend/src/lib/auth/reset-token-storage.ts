// Leaves the URL once read because Replay records every page URL unscrubbed, and a language switch remounts the modal; cleared on close.
const TOKEN_KEY = "disscount-reset-token";

// Storage can be full or blocked; the URL token must still work from memory then.
function stored<T>(action: () => T): T | null {
  try {
    return action();
  } catch {
    return null;
  }
}

export function storeResetToken(token: string): boolean {
  return (
    stored(() => {
      sessionStorage.setItem(TOKEN_KEY, token);
      return true;
    }) ?? false
  );
}

export function readStoredResetToken(): string | null {
  return stored(() => sessionStorage.getItem(TOKEN_KEY));
}

export function clearStoredResetToken() {
  stored(() => sessionStorage.removeItem(TOKEN_KEY));
}

export function removeResetTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  if (!params.has("token")) return;

  params.delete("token");
  const query = params.toString().replace(/%2F/g, "/");
  const url = window.location.pathname + (query ? `?${query}` : "");
  window.history.replaceState(window.history.state, "", url);
}

/** Runs before Sentry.init so Replay's first snapshot has a clean URL; a token still in the URL must keep Replay off. */
export function moveResetTokenOutOfUrl(): boolean {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  if (params.get("modal") !== "reset-password" || !token) return false;

  // Blocked storage keeps the token in the URL, the modal's only other way to get it.
  if (!storeResetToken(token)) return true;

  removeResetTokenFromUrl();
  return false;
}
