# HA Performance Monitor：个人项目落地方案

## 1. 目标与结论

为 haha-note 建立一条低成本的真实用户性能观测链路，回答三个问题：

1. 用户实际看到首屏内容需要多久？
2. 哪些页面、设备、网络或版本明显更慢？
3. 出错时能否在 Sentry 中定位到堆栈和上下文？

本项目采用以下职责分工：

```text
浏览器
  ├─ web-vitals：采集 FCP / LCP / CLS / INP / TTFB
  ├─ 业务性能埋点：编辑器 ready、接口耗时、AI 首 token
  └─ sendBeacon -> /api/performance

/api/performance -> MongoDB（或项目已有数据库）-> Dashboard 聚合

Sentry：只负责错误、异常上下文和低采样性能排查
```

不要把所有真实用户性能数据都作为 Sentry 事件上报。Sentry 保留在错误定位的位置；RUM 数据使用自己的轻量接口保存，避免 Replay、日志和全量 traces 持续消耗免费额度。

## 2. 当前配置需要调整的地方

当前 `instrumentation-client.ts` 中有以下高消耗配置：

- `tracesSampleRate: 1`：100% 性能事务都会上报。
- `replayIntegration()`：会产生 Replay 数据。
- `replaysOnErrorSampleRate: 1.0`：每个错误都录制 Replay。
- `enableLogs: true`：日志也会进入 Sentry 数据量。
- `sendDefaultPii: true`：不符合个人项目默认的最小化采集原则。

建议先调整为：

```ts
Sentry.init({
  tracesSampleRate: 0.05,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0.05,
  enableLogs: false,
  sendDefaultPii: false,
});
```

如果需要保留 Replay，优先只在测试环境或短时间排障期间开启。生产环境的性能数据改由 `web-vitals` 采集。

## 3. 指标范围

### 3.1 自动采集的字段指标

使用 `web-vitals` 一次性接入，不需要为每个页面手写 `PerformanceObserver`：

- `LCP`：主要内容出现时间，作为首屏主指标。
- `FCP`：第一次出现文字或图片的时间。
- `TTFB`：浏览器收到首字节的时间。
- `INP`：用户交互到下一次绘制的响应延迟。
- `CLS`：页面意外布局位移。

查看首屏时优先看 `LCP p75`，不要只看平均值。`FCP` 代表“开始看到内容”，不一定代表页面已经可用。

### 3.2 需要业务代码手动标记的字段

浏览器无法理解 haha-note 的业务完成条件，因此以下指标需要手动埋点：

- `note_open_completed`：笔记内容加载并可编辑。
- `editor_ready`：编辑器完成初始化并可交互。
- `note_save_completed`：保存请求完成。
- `search_completed`：搜索结果可展示。
- `ai_first_token`：AI 流式响应收到首 token。
- `ai_generation_completed`：AI 完整响应结束。
- `ai_generation_failed` / `ai_generation_cancelled`：失败和取消。

手动埋点只记录耗时、成功状态和脱敏后的路由，不记录正文或 prompt。

## 4. 数据契约

所有 RUM 数据统一为以下结构：

```ts
type PerformanceEvent = {
  name: string;
  value: number;
  metricId: string;
  route: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  networkType?: string;
  release?: string;
  success?: boolean;
  rating?: 'good' | 'needs-improvement' | 'poor' | 'unknown';
  createdAt: string;
};
```

允许上报：耗时、数值、成功状态、评级、脱敏后的路由模式、设备类型、网络类型和版本号。

禁止上报：笔记正文、AI prompt、AI 回复、真实资源 ID、完整 URL query、token、cookie、鉴权 header、用户输入内容和可直接识别用户的个人信息。

## 5. 上报规则

### 5.1 Web Vitals 上报

先安装依赖：

```bash
npm install web-vitals
```

```ts
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

function reportMetric(metric: {
  name: string;
  value: number;
  id: string;
  rating?: string;
}) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    metricId: metric.id,
    route: getSafeRoute(),
    deviceType: getDeviceType(),
    networkType: navigator.connection?.effectiveType ?? 'unknown',
    release: process.env.NEXT_PUBLIC_APP_VERSION ?? 'unknown',
    rating: metric.rating ?? 'unknown',
    createdAt: new Date().toISOString(),
  });

  navigator.sendBeacon('/api/performance', body);
}

onCLS(reportMetric);
onFCP(reportMetric);
onINP(reportMetric);
onLCP(reportMetric);
onTTFB(reportMetric);
```

生产环境可以按 10% 采样；用户量很小时先使用 100%，但必须保留 `metricId`，避免同一指标重复入库。

### 5.2 业务耗时埋点

```ts
const startedAt = performance.now();

await openNote();

reportPerformance({
  name: 'note_open_completed',
  value: performance.now() - startedAt,
  success: true,
});
```

## 6. 后端接口与存储

新增 `app/api/performance/route.ts`：

1. 只接受白名单中的 `name` 和字段。
2. 限制单条 payload 大小，例如 8 KB。
3. 校验 `value` 为有限非负数。
4. 对 `route` 做模式化处理，不接受原始 query。
5. 写入 MongoDB；如果项目后续迁移到 PostgreSQL，字段可以直接映射。
6. 查询接口只返回聚合结果，不返回原始用户记录。

建议的 MongoDB 文档：

```json
{
  "name": "LCP",
  "value": 1840,
  "metricId": "v4-abc",
  "route": "/",
  "deviceType": "mobile",
  "networkType": "4g",
  "release": "2026.08.19",
  "rating": "good",
  "createdAt": "2026-08-19T10:00:00.000Z"
}
```

索引：

```text
{ name: 1, route: 1, createdAt: -1 }
{ release: 1, deviceType: 1, createdAt: -1 }
```

保留周期先设为 30 天。个人项目通常不需要永久保存原始 RUM 记录；日报或周报只保存聚合结果即可。

## 7. 汇总与 Dashboard

`app/(home)/performance/page.tsx` 展示以下内容：

- 最近 7 天各指标的 `p50 / p75 / p95`。
- 按 `route`、`deviceType`、`networkType`、`release` 筛选。
- 样本数 `samples`，样本不足时显示“数据不足”。
- 超过预算的指标和最慢的接口/业务动作。
- AI 首 token 的 p75、完成率、失败率、取消率。

MongoDB 聚合时使用 `$percentile`（MongoDB 版本支持时）或在服务端读取有限样本后计算分位数。不要用平均值替代 p75。

第一版预算：

```ts
export const PERFORMANCE_BUDGET = {
  LCP: 2500,
  INP: 200,
  CLS: 0.1,
  TTFB: 800,
  note_open_completed: 800,
  note_save_completed: 500,
  search_completed: 500,
  ai_first_token: 1500,
};
```

`LCP p75 <= 2500ms` 作为良好目标；预算不是用户体验的绝对结论，要结合设备、网络和样本数一起判断。

## 8. 实施顺序

### 第 1 步：先控制 Sentry 用量

- 将 `tracesSampleRate` 从 `1` 调到 `0.05`。
- 关闭生产 Replay 和 Sentry Logs。
- 将 `sendDefaultPii` 调为 `false`。
- 在 Sentry 控制台确认开发环境不会进入生产项目。

### 第 2 步：接入 Web Vitals

- 安装 `web-vitals`。
- 新增 `src/lib/performance/` 下的类型、路由脱敏、设备识别和上报函数。
- 在根布局挂载 `WebVitalsReporter`。

### 第 3 步：增加业务指标

- 先做 `note_open_completed`、`editor_ready`、`ai_first_token`。
- 再补充保存、搜索、AI 完成/失败/取消。
- 所有埋点通过统一 `reportPerformance` 函数发送。

### 第 4 步：建立 API 和 Dashboard

- 新增 `/api/performance` 写入和聚合查询接口。
- 建立索引和 30 天清理任务。
- 在现有 `/performance` 页面展示 p75、样本数和预算状态。

### 第 5 步：验证

- 用移动端、桌面端和慢网络各访问 10 次。
- 检查浏览器 Network 中 `/api/performance` 是否成功。
- 检查数据库中没有正文、prompt、真实资源 ID 或 token。
- 用两个 release 对比 LCP p75 是否能按版本筛选。
- 运行 `npm run lint` 和 `npm run build`。

## 9. 个人项目的取舍

推荐组合：

```text
Sentry       错误、堆栈、异常上下文，性能 5% 采样
web-vitals   浏览器真实用户性能指标
MongoDB      复用项目现有数据库，保存 30 天原始数据
Dashboard    复用现有 /performance 页面
```

如果不想维护接口和页面，可以把 Web Analytics 交给 Cloudflare Web Analytics；如果想看事件、来源和漏斗，可以使用 Umami。无论选哪种方案，业务“首屏可用”仍然需要 `performance.mark()` 或统一业务埋点，因为平台无法自动知道“笔记已经可编辑”或“AI 首 token 已到达”。

## 10. 参考资料

- [web-vitals：使用 RUM 测量 Web Vitals](https://web.dev/articles/vitals-measurement-getting-started?hl=en)
- [Cloudflare Web Analytics：真实用户监控](https://developers.cloudflare.com/web-analytics/about/)
- [Umami：自托管、事件和性能分析](https://docs.umami.is/docs)
- [Sentry：性能指标监控与聚合](https://docs.sentry.io/api/monitors/create-a-monitor-for-a-project/)
