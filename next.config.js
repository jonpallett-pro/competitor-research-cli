/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure external packages for server components
  experimental: {
    serverComponentsExternalPackages: ['pino', 'pino-pretty'],
  },
};

export default nextConfig;
