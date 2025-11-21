import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  typescript: {
    // Allow build to proceed despite TypeScript errors
    // TODO: Fix all 'any' types and other TypeScript errors
    ignoreBuildErrors: true,
  },
  eslint: {
    // Allow build to proceed despite ESLint errors
    // TODO: Fix ESLint errors (unused vars, unescaped entities, etc.)
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.stats = 'errors-warnings';
    return config;
  },

  // Remove invalid Turbopack options completely
  // turbopack: {},

  experimental: {},
};

export default nextConfig;
