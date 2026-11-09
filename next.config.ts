import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Every route is prerendered to static HTML in out/. No server features.
  output: 'export',
  reactStrictMode: true,
};

export default nextConfig;
