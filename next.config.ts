import { withSentryConfig } from '@sentry/nextjs';
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 禁用 Pages Router
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],

  reactStrictMode: true,
  sassOptions: {
    includePaths: ['./src/styles'],
    prependData: `

    `,
  },
  swcMinify: true,
  // 按需加载
  compiler: {
    styledComponents: true,
  },
  // 配置图片域名（如果需要使用外部图片）
  // images: {
  //   domains: ['your-cdn-domain.com'],
  // },
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
};

module.exports = nextConfig;

export default withSentryConfig(undefined, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: 'cb276019559e',

  project: 'javascript-nextjs',

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: '/monitoring',

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
