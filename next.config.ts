/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  sassOptions: {
    includePaths: ['./src/styles'],
    prependData: `

    `,
  },
  swcMinify: true,
  compiler: {
    styledComponents: true,
  },
  // 配置图片域名（如果需要使用外部图片）
  images: {
    domains: ['your-cdn-domain.com'],
  },
  // 启用 Webpack 5
  webpack5: true,
  // 配置环境变量
  env: {
    APP_ENV: process.env.APP_ENV,
  },
  // 如果是 SSR 项目
  experimental: {
    serverComponentsExternalPackages: ['sass'],
  },
}

module.exports = nextConfig