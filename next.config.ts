import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  reactStrictMode: true,
  sassOptions: {
    includePaths: ['./src/styles'],
    prependData: ``,
  },
  compiler: {
    styledComponents: true,
  },
  env: {
    APP_ENV: process.env.APP_ENV,
  },
  experimental: {
    serverComponentsExternalPackages: ['sass'],
  },
};

// 根据环境决定是否启用 Sentry
let finalConfig = nextConfig;

if (process.env.NODE_ENV === 'production') {
  finalConfig = withSentryConfig(nextConfig, {
    org: 'cb276019559e',
    project: 'javascript-nextjs',
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
