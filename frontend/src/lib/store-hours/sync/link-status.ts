export type LinkStatus = "ok" | "broken" | "unverified";

/**
 * Only a page the site itself says is gone (404, 410) counts as broken; bot
 * walls (403), rate limits (429) and outages (5xx) prove nothing about it.
 */
export function linkStatusOf(httpStatus: number | null): LinkStatus {
  if (httpStatus === 404 || httpStatus === 410) return "broken";
  if (httpStatus !== null && httpStatus >= 200 && httpStatus < 400) return "ok";

  return "unverified";
}

/** Links grouped by host, so each host is visited one page at a time. */
export function linksByHost(urls: Iterable<string>): string[][] {
  const groups = new Map<string, string[]>();

  for (const url of urls) {
    const host = new URL(url).host;

    groups.set(host, [...(groups.get(host) ?? []), url]);
  }

  return [...groups.values()];
}
