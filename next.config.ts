import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['10.9.0.154'],
  experimental: {
    proxyClientMaxBodySize: '50mb',
  },
};

export default nextConfig;
