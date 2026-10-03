/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@gestor/shared', '@gestor/database'],
};

export default nextConfig;
