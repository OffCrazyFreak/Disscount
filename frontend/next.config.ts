import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proxy API requests in development to the backend server
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8080/api/:path*",
      },
    ];
  },
};

export default nextConfig;
