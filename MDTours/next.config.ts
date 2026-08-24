import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ["sharp", "ffmpeg-static"],
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      { source: "/blog", destination: "/", permanent: true },
      { source: "/blog/:slug", destination: "/", permanent: true },
      { source: "/temoignages", destination: "/historique", permanent: true },
    ];
  },
};

export default nextConfig;
