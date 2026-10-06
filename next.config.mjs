/** @type {import('next').NextConfig} */
const nextConfig = {
  // A self-contained server in .next/standalone, which is what the Docker image runs.
  output: "standalone",
  poweredByHeader: false,
  experimental: { serverActions: { bodySizeLimit: "8mb" } },
};
export default nextConfig;
