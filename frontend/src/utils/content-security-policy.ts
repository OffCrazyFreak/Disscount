// Sentry posts through the same-origin /monitoring tunnel, and Google and Facebook sign-in are redirects.
const SCRIPT_ORIGINS = ["https://cloud.umami.is"];

/** No nonces, because a nonce CSP forces every page dynamic, so Next's inline bootstrap scripts still need 'unsafe-inline'. */
export function buildContentSecurityPolicy(isDevelopment: boolean): string {
  const scriptSources = [
    "'self'",
    "'unsafe-inline'",
    // React's development build uses eval for stack traces and Fast Refresh.
    ...(isDevelopment ? ["'unsafe-eval'"] : []),
    // The barcode-detector polyfill compiles its zxing WebAssembly module in the page.
    "'wasm-unsafe-eval'",
    "blob:",
    ...SCRIPT_ORIGINS,
  ];

  return [
    "default-src 'self'",
    `script-src ${scriptSources.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https: ws: wss:",
    "frame-src 'self' https:",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
  ].join("; ");
}
