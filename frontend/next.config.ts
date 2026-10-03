// frontend/next.config.ts

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.1.4",
    "*.trycloudflare.com",
  ],
};

export default nextConfig;