import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@vambe/database", "@vambe/domain", "@vambe/ui-system"],

  // Prevents bundling native Node.js modules and large server-only packages.
  // These are loaded from node_modules at runtime instead of being bundled.
  serverExternalPackages: ["pg", "pg-native", "@anthropic-ai/sdk"],

  // Tells webpack (used by `next build`) to import only the specific icons/components
  // actually used, instead of the entire barrel file. Turbopack does this automatically.
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
};

export default nextConfig;
