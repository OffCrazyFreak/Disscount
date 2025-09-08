import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ⚠️ TODO: This will allow production builds to complete
    // even if there are ESLint errors
    ignoreDuringBuilds: true,
  },

  async rewrites() {
    const backendOrigin =
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

    return [
      {
        // Proxy all backend API calls except Cijene routes under /api/cijene
        source: "/api/:path((?!cijene/).*)",
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },

  // Apply static security headers at the Next.js layer so they are added
  // to responses (including those proxied via rewrites) without middleware
  // running per-request. Keeps behavior consistent with `middleware.ts`.
  async headers() {
    // Build a CSP that permits Web Workers (blob:) and dev tooling while staying tight in prod
    const csp = [
      "default-src 'self'",
      // In dev, Next and some libs may rely on inline/eval and blob workers
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:`,
      // Explicitly allow workers from same origin and blob URLs
      "worker-src 'self' blob:",
      "style-src 'self' 'unsafe-inline'",
      // Allow images and canvas data/blobs
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      // Allow API calls to same origin and HTTPS; include WS for dev HMR
      `connect-src 'self' https: ws: wss:`,
      // Lock down embedding and legacy objects
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
    ].join("; ");

    return [
      // API routes - security headers for JSON endpoints
      {
        source: "/api/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },

      // Document routes - CSP for HTML pages
      {
        source: "/((?!api/|_next/|favicon|robots).*)", // All non-API and non-static routes
        headers: [
          {
            key: "Content-Security-Policy",
            value: csp,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
