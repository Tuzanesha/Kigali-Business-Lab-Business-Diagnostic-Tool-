/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config: { watchOptions: { poll: number; ignored: string[]; }; }) => {
    config.watchOptions = {
      poll: 1000,
      ignored: ['**/node_modules', '**/.next'],
    };
    return config;
  },
};

export default nextConfig;