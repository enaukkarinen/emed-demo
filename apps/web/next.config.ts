import type { NextConfig } from "next";
import path from "path";
import { loadEnvConfig } from "@next/env";

const repoRoot = path.resolve(__dirname, "../../");

// Load .env from the monorepo root
loadEnvConfig(repoRoot);

const nextConfig: NextConfig = {
  serverExternalPackages: ["@elastic/elasticsearch", "@modelcontextprotocol/sdk", "openai"],
  outputFileTracingRoot: repoRoot,
};

export default nextConfig;
