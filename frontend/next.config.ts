import { withSentryConfig } from "@sentry/nextjs";
import withSerwistInit from "@serwist/next";
import { randomUUID } from "node:crypto";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // Service worker only runs in production builds; in dev it would fight
  // Turbopack/HMR. The React Query persistence layer still works in dev.
  disable: process.env.NODE_ENV === "development",
  // Precache the offline fallback page so it's available with no connection.
  additionalPrecacheEntries: [{ url: "/offline", revision: randomUUID() }],
  reloadOnOnline: true,
});

const nextConfig: NextConfig = {
  // Emit a minimal self-contained server build (.next/standalone) for a lean Docker image.
  output: "standalone",

  async rewrites() {
    const backendOrigin =
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

    return [
      {
        // Proxy backend API calls - exclude /api/cijene/* (external), /api/auth/* and
        // /api/account/* (better-auth, handled by Next.js)
        source: "/api/:path((?!cijene/)(?!auth/)(?!account/).*)",
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },

  async headers() {
    // Pragmatic CSP: since Next needs 'unsafe-inline'/'unsafe-eval', a granular
    // per-domain allowlist buys little real XSS protection while breaking third-party
    // scripts. We allow https: broadly and keep the cheap, high-value protections
    // (no framing of our pages, no plugins, locked base URI).
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https:",
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

    return [
      {
        // Cheap hardening on every response
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
      {
        // CSP only on HTML documents (not API or static assets)
        source: "/((?!api/|_next/|favicon|robots).*)",
        headers: [{ key: "Content-Security-Policy", value: csp }],
      },
    ];
  },
};

export default withSerwist(
  withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "disscount",

  project: "disscount-frontend",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
  }),
);
