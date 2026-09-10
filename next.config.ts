import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  reactStrictMode: true,
  sassOptions: {
    includePaths: ['./src/styles'],
    // prependData 在 Next.js 16 中需要改为 additionalData
    additionalData: ``,
  },
  compiler: {
    // styledComponents 在 Next.js 16 中需要更详细的配置
    styledComponents: {
      ssr: true,
      displayName: process.env.NODE_ENV !== 'production',
    },
  },
  env: {
    APP_ENV: process.env.NODE_ENV,
    APP_VERCEL_ENV: process.env.VERCEL_ENV,
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(), // 添加构建时间，防止vercel缓存导致代码不是最新
  },
  // 修改这里：移除 experimental.serverComponentsExternalPackages
  // 使用 serverExternalPackages
  serverExternalPackages: ['sass'],
};

// Sentry 仅在生产环境启用；如需临时关闭，可设置 SENTRY_DISABLED=true。
const isSentryEnabled =
  process.env.NODE_ENV === 'production' &&
  process.env.VERCEL_ENV === 'production' &&
  process.env.SENTRY_DISABLED !== 'true';

const finalConfig = isSentryEnabled
  ? withSentryConfig(nextConfig, {
      org: 'cb276019559e',
      project: 'haha-note',
      silent: !process.env.CI,
      widenClientFileUpload: true,
      tunnelRoute: '/monitoring',
      webpack: {
        automaticVercelMonitors: true,
        treeshake: {
          removeDebugLogging: true,
        },
      },
    })
  : nextConfig;

export default finalConfig;
