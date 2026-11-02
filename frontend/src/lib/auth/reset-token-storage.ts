// The reset token leaves the URL once read: Sentry Replay records the page URL of every
// snapshot with no hook to scrub it, and a language switch remounts the modal under the
// new [locale]. Session-scoped, cleared when the modal closes.
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

// Runs before Sentry.init, so Replay's first snapshot already has a clean URL.
export function moveResetTokenOutOfUrl() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  if (params.get("modal") !== "reset-password" || !token) return;

  // Blocked storage keeps the token in the URL, the modal's only other way to get it.
  if (storeResetToken(token)) removeResetTokenFromUrl();
}
