import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backendOrigin =
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

    return [
      {
        // Proxy backend API calls — exclude /api/cijene/* (external) and /api/auth/* (better-auth, handled by Next.js)
        source: "/api/:path((?!cijene/)(?!auth/).*)",
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

export default nextConfig;
