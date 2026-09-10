import 'antd/dist/reset.css';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import '@/assets/styles/var.scss';
import '@/assets/styles/global.scss';
import '@/assets/iconfont/index.css';
import '@/assets/styles/index.scss'; // 必须在reset.css之后引入
import { App as AntdApp, ConfigProvider } from 'antd';
// 更改ant-design 主题'
import theme_config from '@/assets/styles/theme/theme_config';
import React from 'react';
import AntdMessageProvider from '@/components/common/AntdMessageProvider';
import WebVitalsReporter from '@/components/performance/WebVitalsReporter';
import type { Metadata, Viewport } from 'next';
import { SITE_DEFAULT_DESCRIPTION, SITE_NAME, SITE_TITLE_TEMPLATE, getSiteUrl } from '@/lib/site';

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: {
    default: SITE_NAME,
    template: SITE_TITLE_TEMPLATE,
  },
  description: SITE_DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  icons: {
    icon: '/logo.ico',
    shortcut: '/logo.ico',
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DEFAULT_DESCRIPTION,
    ...(siteUrl ? { url: siteUrl } : {}),
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary',
    title: SITE_NAME,
    description: SITE_DEFAULT_DESCRIPTION,
  },
  // 非生产环境（本地 / preview）全程 noindex，避免被搜索引擎收录。
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  ...(siteUrl ? { url: siteUrl } : {}),
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body>
        <AntdRegistry>
          <ConfigProvider theme={theme_config}>
            <AntdApp>
              <AntdMessageProvider>
                {children}
                <WebVitalsReporter />
                <div id="portal-root"></div>
              </AntdMessageProvider>
            </AntdApp>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
};

export default RootLayout;