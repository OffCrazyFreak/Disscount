import { BlockList, isIP } from "node:net";

import { CLOUDFLARE_IP_RANGES } from "@/lib/client-ip/cloudflare-ip-ranges";

// better-auth reads the client address from this header (advanced.ipAddress).
export const CLIENT_IP_HEADER = "cf-connecting-ip";

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

/**
 * Traefik always writes the peer it accepted the connection from as the last
 * x-forwarded-for hop, so only that hop is trustworthy. cf-connecting-ip counts
 * only when that peer is a Cloudflare edge; a caller reaching the origin directly
 * is keyed on its own address instead of whatever it put in the header.
 */
export function resolveClientIp(headers: Headers): string | null {
  const peer = headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  if (!peer || !isIP(peer)) return null;

  const connectingIp = headers.get(CLIENT_IP_HEADER)?.trim();
  if (connectingIp && isIP(connectingIp) && isCloudflare(peer))
    return connectingIp;

  return peer;
}

export function withTrustedClientIp(request: Request): Request {
  // Copied entry by entry: in the Vitest environment, new Headers(request.headers)
  // drops every header but content-type.
  const headers = new Headers([...request.headers]);
  const clientIp = resolveClientIp(headers);

  if (clientIp) headers.set(CLIENT_IP_HEADER, clientIp);
  else headers.delete(CLIENT_IP_HEADER);

  // Next passes route handlers a Proxy around the request, and Node 24's undici
  // rejects new Request(proxy) on its private-field check, so copy it by parts.
  // Node requires duplex for a streamed body; TypeScript's RequestInit lacks it.
  const init: RequestInit & { duplex: "half" } = {
    method: request.method,
    headers,
    body: request.body,
    signal: request.signal,
    duplex: "half",
  };

  return new Request(request.url, init);
}
