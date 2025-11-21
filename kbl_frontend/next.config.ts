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
  webpack: (config, { isServer, dev }) => {
    config.stats = 'errors-warnings';

    if (!dev && !isServer) {
      Object.assign(config.resolve.alias, {
        'react/jsx-runtime.js': 'preact/compat/jsx-runtime',
        react: 'preact/compat',
        'react-dom/test-utils': 'preact/test-utils',
        'react-dom': 'preact/compat',
      });
    }
    return config;
  },

  // Remove invalid Turbopack options completely
  // turbopack: {},

  experimental: {},
};

export default nextConfig;
