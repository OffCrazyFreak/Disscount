import { BlockList, isIP } from "node:net";

import { CLOUDFLARE_IP_RANGES } from "@/lib/client-ip/cloudflare-ip-ranges";

// better-auth reads the client address from this header (advanced.ipAddress).
export const CLIENT_IP_HEADER = "cf-connecting-ip";
// Cloudflare's two-letter guess at the visitor's country, stored on new sessions.
export const CLIENT_COUNTRY_HEADER = "cf-ipcountry";

const cloudflare = new BlockList();
for (const range of CLOUDFLARE_IP_RANGES) {
  const [network, prefix] = range.split("/");
  cloudflare.addSubnet(
    network,
    Number(prefix),
    isIP(network) === 6 ? "ipv6" : "ipv4",
  );
}

function isCloudflare(ip: string) {
  return cloudflare.check(ip, isIP(ip) === 6 ? "ipv6" : "ipv4");
}

/** Traefik writes its peer as the last x-forwarded-for hop, so only that is trustworthy, and cf-connecting-ip counts only from a Cloudflare edge. */
export function resolveClientIp(headers: Headers): string | null {
  const peer = headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  if (!peer || !isIP(peer)) return null;

  const connectingIp = headers.get(CLIENT_IP_HEADER)?.trim();
  if (connectingIp && isIP(connectingIp) && isCloudflare(peer))
    return connectingIp;

  return peer;
}

// "XX" is unknown and "T1" is Tor; neither names a place worth showing.
const NOT_A_COUNTRY = new Set(["XX", "T1"]);

/** The country of a request withTrustedClientIp already vetted, or null. */
export function trustedCountry(headers: Headers | undefined): string | null {
  const code = headers?.get(CLIENT_COUNTRY_HEADER)?.trim().toUpperCase();
  if (!code || !/^[A-Z]{2}$/.test(code) || NOT_A_COUNTRY.has(code)) return null;
  return code;
}

function isCloudflarePeer(headers: Headers) {
  const peer = headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  return !!peer && isIP(peer) !== 0 && isCloudflare(peer);
}

export function withTrustedClientIp(request: Request): Request {
  // Copied entry by entry, because in Vitest new Headers(request.headers) drops every header but content-type.
  const headers = new Headers([...request.headers]);
  const clientIp = resolveClientIp(headers);

  if (clientIp) headers.set(CLIENT_IP_HEADER, clientIp);
  else headers.delete(CLIENT_IP_HEADER);

  // Same trust rule as the address: only a Cloudflare edge may set the country.
  if (!isCloudflarePeer(headers)) headers.delete(CLIENT_COUNTRY_HEADER);

  // Next passes a Proxy around the request and Node 24's undici rejects it, so copy by parts; duplex is required for a streamed body.
  const init: RequestInit & { duplex: "half" } = {
    method: request.method,
    headers,
    body: request.body,
    signal: request.signal,
    duplex: "half",
  };

  return new Request(request.url, init);
}
