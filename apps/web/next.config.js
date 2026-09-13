/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@codecraft/shared',
    '@codecraft/db',
    '@codecraft/ai',
    '@codecraft/sandbox',
    '@codecraft/agent',
  ],
};

export default nextConfig;
