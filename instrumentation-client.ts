// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://e6d47cd449bfe6a566f6162f3d7c11bb@o4511014812975104.ingest.de.sentry.io/4511014830735440',

  // Add optional integrations for additional features
  integrations: [
    Sentry.replayIntegration(),
    // 新的性能监控集成（替换废弃的 BrowserTracing）
    Sentry.browserTracingIntegration({
      // 可选的配置
      idleTimeout: 10000, // 事务超时时间（毫秒）
    }),
  ],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // 开启 Web Vitals
  _experiments: {
    metrics: {
      enabled: true,
    },
  },
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // 环境区分
  environment: process.env.NODE_ENV,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
