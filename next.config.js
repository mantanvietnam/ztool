/** @type {import('next').NextConfig} */
const nextConfig = {
  // Thêm đoạn code này vào
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's*-ava-talk.zadn.vn',
      },
      {
        protocol: 'https',
        hostname: 's*-ava-grp-talk.zadn.vn',
      },
    ],
  },
};

module.exports = nextConfig;