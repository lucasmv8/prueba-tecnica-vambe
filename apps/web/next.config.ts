import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@vambe/database", "@vambe/domain", "@vambe/ui-system"],
  // Prevent Next.js from bundling native Node.js modules used by the pg driver
  serverExternalPackages: ["pg", "pg-native"],
};

export default nextConfig;
