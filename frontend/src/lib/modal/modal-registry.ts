export const SETTINGS_TABS = [
  "profil",
  "obavijesti",
  "preference",
  "sigurnost",
] as const;

export type SettingsTab = (typeof SETTINGS_TABS)[number];

export type ModalTarget =
  | { name: "login" }
  | { name: "signup" }
  | { name: "forgot-password" }
  | { name: "onboarding" }
  | { name: "settings"; tab: SettingsTab }
  | { name: "shopping-list"; action: "new" }
  | { name: "shopping-list"; action: "edit"; id: string }
  | { name: "digital-card"; action: "new" }
  | { name: "digital-card"; action: "edit"; id: string }
  | { name: "add-to-list"; ean: string }
  | { name: "watchlist"; ean: string };

export const AUTH_MODAL_NAMES = ["login", "signup", "forgot-password"] as const;

function isSettingsTab(value: string): value is SettingsTab {
  return (SETTINGS_TABS as readonly string[]).includes(value);
}

export function parseModalParam(
  searchParams: URLSearchParams
): ModalTarget | null {
  const modal = searchParams.get("modal");
  if (!modal) return null;

  const [name, sub] = modal.split("/");
  const id = searchParams.get("id");
  const ean = searchParams.get("ean");

  switch (name) {
    case "login":
    case "signup":
    case "forgot-password":
    case "onboarding":
      return { name };
    case "settings":
      return { name, tab: sub && isSettingsTab(sub) ? sub : "profil" };
    case "shopping-list":
    case "digital-card":
      if (sub === "new") return { name, action: "new" };
      if (sub === "edit" && id) return { name, action: "edit", id };
      return null;
    case "add-to-list":
    case "watchlist":
      return ean ? { name, ean } : null;
    default:
      return null;
  }
}

function modalParamValue(target: ModalTarget): string {
  switch (target.name) {
    case "settings":
      return `settings/${target.tab}`;
    case "shopping-list":
    case "digital-card":
      return `${target.name}/${target.action}`;
    default:
      return target.name;
  }
}

export function buildModalSearch(
  current: URLSearchParams,
  target: ModalTarget
): string {
  const params = new URLSearchParams(current);
  params.delete("modal");
  params.delete("id");
  params.delete("ean");

  params.set("modal", modalParamValue(target));
  if ("id" in target) params.set("id", target.id);
  if ("ean" in target) params.set("ean", target.ean);

  // URLSearchParams percent-encodes "/", which is legal but ugly in the address
  // bar; decode it back so links read ?modal=settings/profil.
  return `?${params.toString().replace(/%2F/g, "/")}`;
}

export function stripModalSearch(current: URLSearchParams): string {
  const params = new URLSearchParams(current);
  params.delete("modal");
  params.delete("id");
  params.delete("ean");

  const query = params.toString().replace(/%2F/g, "/");
  return query ? `?${query}` : "";
}
