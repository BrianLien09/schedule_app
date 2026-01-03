import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // basePath: "/repo-name", // TODO: Update this to your GitHub repository name for deployment
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
