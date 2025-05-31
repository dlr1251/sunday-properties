import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/property/:id',
        destination: '/property/[id]',
      },
      {
        source: '/my-deals/:dealId',
        destination: '/my-deals/[dealId]',
      },
    ];
  },
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
