import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { DEFAULT_LOCALE, LOCALES } from "./src/i18n/locales";
import { SENTRY_APPLICATION_KEY } from "./src/lib/sentry/application-key";
import { clientEnv, validateClientEnv } from "./src/lib/env";
import {
  buildContentSecurityPolicy,
  buildDocsContentSecurityPolicy,
} from "./src/utils/content-security-policy";
import { isIndexableOrigin } from "./src/utils/indexing";

// Fails `next build` and `next dev` on a malformed public variable, before it is baked in.
validateClientEnv();

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Croatian is unprefixed; every other locale lives under its own path segment.
const LOCALE_PREFIXES = LOCALES.filter((locale) => locale !== DEFAULT_LOCALE);

const nextConfig: NextConfig = {
  // Emit a minimal self-contained server build (.next/standalone) for a lean Docker image.
  output: "standalone",

  // Sentry loads this hook by URL at startup, so the standalone file tracer never finds it.
  // Without it, its diagnostics-channel integrations silently stop recording spans.
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/.pnpm/@sentry+server-runtime-injection@*/**",
      "./node_modules/.pnpm/@sentry+conventions@*/**",
    ],
  },

  // Version skew protection: a tab from an older deploy gets a full page load
  // instead of a client navigation. A build without GIT_SHA skips it.
  deploymentId: process.env.GIT_SHA || undefined,

  // The dev indicator sits bottom-left, on top of the mobile bottom nav.
  devIndicators: false,

  // Inlined so the browser Sentry init can read it too; empty leaves the SDK on NODE_ENV,
  // so `pnpm dev` stays "development".
  env: { SENTRY_ENVIRONMENT: process.env.SENTRY_ENVIRONMENT ?? "" },

  // Set explicitly because Next warns the default can differ between compiler versions,
  // and the effects keyed on existing useMemo/useCallback results rely on them staying.
  reactCompiler: {
    environment: { enablePreserveExistingMemoizationGuarantees: true },
  },

  async headers() {
    const csp = buildContentSecurityPolicy(
      process.env.NODE_ENV === "development",
    );

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
        // Swagger UI is Spring's page, so it gets its own policy and the site-wide one stays as it is.
        source: "/api/swagger-ui/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: buildDocsContentSecurityPolicy(),
          },
        ],
      },
      {
        // CSP only on HTML documents (not API or static assets)
        source: "/((?!api/|_next/|favicon|robots).*)",
        headers: [{ key: "Content-Security-Policy", value: csp }],
      },
      {
        // Reaches browsers only through the Cloudflare cache rule in docs/INFRASTRUCTURE.md.
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache" }],
      },
      {
        // Lists are unlisted, not public. Deliberately a header and not a robots.txt
        // rule: a disallow stops the crawler fetching the page at all, so it would never
        // see the directive. A shared link only leaks by being pasted somewhere
        // crawlable, which is exactly the case this covers.
        source: `/:locale(${LOCALE_PREFIXES.join("|")})?/shopping-lists/:path*`,
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          // The list id is in the path and, while the list is shared, that id is what
          // grants access. The default strict-origin-when-cross-origin would still hand
          // the whole URL to any same-origin subresource and the origin to third
          // parties. Nothing on this page needs a referrer.
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
      // Read at build time, which is fine: NEXT_PUBLIC_APP_URL is a build arg per deploy.
      ...(isIndexableOrigin(clientEnv.NEXT_PUBLIC_APP_URL)
        ? []
        : [
            {
              source: "/:path*",
              headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
            },
          ]),
    ];
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "disscount",

  project: "disscount-frontend",

  applicationKey: SENTRY_APPLICATION_KEY,

  // Both are empty outside CI image builds, which skips the upload and auto-detects the release.
  authToken: process.env.SENTRY_AUTH_TOKEN,

  release: {
    name: process.env.GIT_SHA,
    // Marks which environment each release went to; skipped when the build has none.
    deploy: process.env.SENTRY_ENVIRONMENT
      ? { env: process.env.SENTRY_ENVIRONMENT }
      : undefined,
  },

  // Image builds run inside BuildKit without CI set, so the token is what marks an upload.
  silent: !process.env.SENTRY_AUTH_TOKEN,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  bundleSizeOptimizations: {
    excludeDebugStatements: true,
  },
});
