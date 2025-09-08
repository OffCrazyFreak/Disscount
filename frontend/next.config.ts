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
        source: "/((?!api/).*)", // All routes except /api/*
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
