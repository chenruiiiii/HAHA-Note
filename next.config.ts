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
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(), // 添加构建时间，防止vercel缓存导致代码不是最新
  },
  // 修改这里：移除 experimental.serverComponentsExternalPackages
  // 使用 serverExternalPackages
  serverExternalPackages: ['sass'],
};

// 根据环境决定是否启用 Sentry
let finalConfig = nextConfig;

if (process.env.NODE_ENV === 'production') {
  finalConfig = withSentryConfig(nextConfig, {
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
  });
}

export default finalConfig;
