import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // build autonome pour l'image Docker (node server.js, sans node_modules complets)
  output: "standalone",
};

export default nextConfig;
