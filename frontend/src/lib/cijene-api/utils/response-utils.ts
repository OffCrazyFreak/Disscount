import { NextResponse } from "next/server";

export function createApiResponse<T>(
  data: T,
  options: {
    status?: number;
    cacheControl?: string;
    additionalHeaders?: Record<string, string>;
  } = {},
) {
  const {
    status = 200,
    cacheControl = "no-cache",
    additionalHeaders = {},
  } = options;

  const response = NextResponse.json(data, { status });

  response.headers.set("Cache-Control", cacheControl);

  const immutableHeaders = new Set([
    "x-content-type-options",
    "x-frame-options",
    "strict-transport-security",
    "referrer-policy",
    "x-dns-prefetch-control",
    "x-xss-protection",
  ]);
  Object.entries(additionalHeaders).forEach(([key, value]) => {
    if (!immutableHeaders.has(key.toLowerCase())) {
      response.headers.set(key, value);
    }
  });

  return response;
}
