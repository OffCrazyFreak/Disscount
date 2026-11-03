import type { ModalTarget } from "@/lib/modal/modal-registry";

// Every search param a modal target writes, so opening or closing one leaves none behind.
const MODAL_PARAM_NAMES = [
  "modal",
  "id",
  "ean",
  "type",
  "list",
  "item",
  "error",
];

function modalParamValue(target: ModalTarget): string {
  switch (target.name) {
    case "settings":
      return `settings/${target.tab}`;
    case "onboarding":
      return target.mode === "replay" ? "onboarding/replay" : "onboarding";
    case "shopping-list":
    case "digital-card":
      return `${target.name}/${target.action}`;
    default:
      return target.name;
  }
}

export function buildModalSearch(
  current: URLSearchParams,
  target: ModalTarget,
): string {
  const params = new URLSearchParams(current);
  for (const name of MODAL_PARAM_NAMES) params.delete(name);

  params.set("modal", modalParamValue(target));
  if ("id" in target) params.set("id", target.id);
  if ("ean" in target) params.set("ean", target.ean);
  if ("watchType" in target && target.watchType)
    params.set("type", target.watchType);
  if ("listId" in target && target.listId) params.set("list", target.listId);
  if ("itemName" in target && target.itemName)
    params.set("item", target.itemName);
  if ("linkError" in target && target.linkError)
    params.set("error", target.linkError);

  // URLSearchParams percent-encodes "/"; decode it so links read ?modal=settings/profil.
  return `?${params.toString().replace(/%2F/g, "/")}`;
}

export function stripModalSearch(current: URLSearchParams): string {
  const params = new URLSearchParams(current);
  for (const name of MODAL_PARAM_NAMES) params.delete(name);

  const query = params.toString().replace(/%2F/g, "/");
  return query ? `?${query}` : "";
}
