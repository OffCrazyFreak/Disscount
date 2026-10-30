import type { ModalTarget } from "@/lib/modal/modal-registry";

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
  params.delete("modal");
  params.delete("id");
  params.delete("ean");
  params.delete("type");

  params.set("modal", modalParamValue(target));
  if ("id" in target) params.set("id", target.id);
  if ("ean" in target) params.set("ean", target.ean);
  if ("watchType" in target && target.watchType)
    params.set("type", target.watchType);

  // URLSearchParams percent-encodes "/"; decode it so links read ?modal=settings/profil.
  return `?${params.toString().replace(/%2F/g, "/")}`;
}

export function stripModalSearch(current: URLSearchParams): string {
  const params = new URLSearchParams(current);
  params.delete("modal");
  params.delete("id");
  params.delete("ean");
  params.delete("type");

  const query = params.toString().replace(/%2F/g, "/");
  return query ? `?${query}` : "";
}
