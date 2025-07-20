/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@quiz-battle/shared', '@quiz-battle/trpc'],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  },
};

module.exports = nextConfig;