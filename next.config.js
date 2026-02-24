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

  async headers() {
    return [
      {
        source: '/(.*)', // Áp dụng cho tất cả các đường dẫn trong app
        headers: [
          {
            key: 'Content-Security-Policy',
            // Dòng dưới đây là nơi bạn cấu hình
            value: "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://ztool.phoenixtech.vn https://apis.ztool.ai.vn https://www.google-analytics.com https://www.googletagmanager.com https://sp.zalo.me https://zjs.zalo.me; object-src 'none';", 
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;