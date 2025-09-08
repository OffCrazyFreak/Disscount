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
};

export default nextConfig;
