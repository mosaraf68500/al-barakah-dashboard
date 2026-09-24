import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // Decision 7: allow-list the image hosts referenced by the data (Unsplash, Google/Firebase-hosted assets, avatars).
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: '**.firebasestorage.app' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
    ],
  },
};

export default nextConfig;
