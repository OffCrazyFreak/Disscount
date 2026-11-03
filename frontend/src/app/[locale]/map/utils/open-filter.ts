import type { OpeningStatus } from "@/lib/store-hours/opening-status";

export type OpenFilter = "off" | "confirmed" | "with-unconfirmed";

const PARAM_OF: Record<Exclude<OpenFilter, "off">, string> = {
  confirmed: "now",
  "with-unconfirmed": "now-or-unconfirmed",
};

/** The `open` URL parameter's value for a filter; null removes it. */
export function openParamOf(filter: OpenFilter): string | null {
  return filter === "off" ? null : PARAM_OF[filter];
}

export function openFilterOf(param: string | null): OpenFilter {
  if (param === PARAM_OF.confirmed) return "confirmed";
  if (param === PARAM_OF["with-unconfirmed"]) return "with-unconfirmed";

  return "off";
}

/** What "open now" keeps: open stores, and with the second switch the unknown ones too. */
export function passesOpenFilter(
  status: OpeningStatus,
  filter: OpenFilter,
): boolean {
  if (filter === "off") return true;
  if (status.state === "open" || status.state === "closing-soon") return true;

  return filter === "with-unconfirmed" && status.state === "unconfirmed";
}
