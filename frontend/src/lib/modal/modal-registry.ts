const SETTINGS_TABS = [
  "profil",
  "obavijesti",
  "preference",
  "sigurnost",
] as const;

export type SettingsTab = (typeof SETTINGS_TABS)[number];

const WATCH_TYPE_PARAMS = ["percentage", "absolute"] as const;

export type WatchTypeParam = (typeof WATCH_TYPE_PARAMS)[number];

export type ModalTarget =
  | { name: "login" }
  | { name: "signup" }
  | { name: "forgot-password" }
  | { name: "reset-password" }
  | { name: "email-verified" }
  | { name: "email-changed" }
  | { name: "contact" }
  | { name: "donate" }
  | { name: "onboarding"; mode: "required" | "replay" }
  | { name: "settings"; tab: SettingsTab }
  | { name: "shopping-list"; action: "new" }
  | { name: "shopping-list"; action: "edit"; id: string }
  | { name: "shopping-list"; action: "share"; id: string }
  | { name: "shopping-list"; action: "copy"; id: string }
  | { name: "digital-card"; action: "new" }
  | { name: "digital-card"; action: "edit"; id: string }
  | { name: "digital-card"; action: "view"; id: string }
  | { name: "shopping-list-actions"; id: string }
  | { name: "add-to-list"; ean: string }
  | { name: "product-actions"; ean: string }
  | { name: "watchlist"; ean: string; watchType?: WatchTypeParam };

// Login-style modals shown to logged-out users when a protected modal is opened.
export const AUTH_MODAL_NAMES = ["login", "signup", "forgot-password"] as const;

// Modals reachable by anyone (from email links, or a shared link); never auth-gated.
const PUBLIC_MODAL_NAMES = [
  "reset-password",
  "email-verified",
  "email-changed",
  "contact",
  "donate",
  // Two of its four actions need no account, and the gated two gate themselves.
  "product-actions",
] as const;

/** Reachable without an account, so nothing may pre-empt one of these. */
export function isPublicModal(name: string): boolean {
  return (PUBLIC_MODAL_NAMES as readonly string[]).includes(name);
}

export function isSettingsTab(value: string): value is SettingsTab {
  return (SETTINGS_TABS as readonly string[]).includes(value);
}

export function isWatchTypeParam(
  value: string | null,
): value is WatchTypeParam {
  return (WATCH_TYPE_PARAMS as readonly string[]).includes(value ?? "");
}
