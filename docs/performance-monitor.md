# HA Performance Monitor 第一版实施方案

## 目标

`HA Performance Monitor` 是 haha-note 的轻量级性能检测工具。第一版目标不是替代完整 APM 平台，而是为 AI 笔记助手建立一条可解释、可展示、可迭代的性能观测闭环：

1. 采集页面、接口、编辑器和 AI 流式生成的关键性能指标。
2. 用统一事件模型上报，避免散落在业务代码里的临时埋点。
3. 对路由和字段做脱敏，避免上传笔记正文、AI prompt、AI 回复和真实资源 ID。
4. 在内部 Dashboard 中查看 P75、成功率、慢请求和性能预算状态。

## 第一版关键路径

优先监控 4 条用户路径：

1. 首页和笔记列表加载。
2. 打开一篇笔记并进入可编辑状态。
3. 保存、搜索等高频笔记操作。
4. AI 对话和 AI 总结的流式生成体验。

第一版不做全站链路追踪，不做 session replay，不引入复杂 OpenTelemetry。

## 指标设计

### 页面性能

- `LCP`: 主要内容出现耗时。
- `INP`: 点击、输入等交互响应延迟。
- `CLS`: 页面意外布局位移。
- `FCP`: 首次内容绘制。
- `TTFB`: 首字节时间。

### 业务性能

- `api_request_completed`: 前端 API 请求耗时。
- `note_open_completed`: 打开笔记耗时。
- `note_save_completed`: 保存笔记耗时。
- `search_completed`: 搜索耗时。
- `editor_ready`: 编辑器可编辑耗时。

### AI 性能

- `ai_generation_started`: AI 请求发起。
- `ai_first_token`: 首 token 或首次进入 streaming 的近似耗时。
- `ai_generation_completed`: AI 完整生成耗时。
- `ai_generation_cancelled`: 用户取消生成。
- `ai_generation_failed`: 生成失败。

### 公共维度

- `route`: 脱敏后的路由模式。
- `device_type`: `mobile`、`tablet` 或 `desktop`。
- `network_type`: 浏览器可识别的网络类型。
- `release`: 当前前端版本。
- `timestamp`: 上报时间。
- `rating`: Web Vitals 评级或自定义预算评级。

## 隐私策略

禁止上传：

- 笔记正文。
- AI prompt。
- AI 回复。
- 真实 `noteId`、`repoId`、`fileId`、`docsId`。
- 完整 URL query。
- token、cookie、鉴权 header。

允许上传：

- 脱敏后的 route pattern。
- 耗时和数值指标。
- 是否成功。
- 错误类型或错误阶段。
- 设备类型、网络类型、版本号。

## 目录设计

```txt
src/lib/performance/
  index.ts
  types.ts
  track.ts
  route.ts
  device.ts
  budget.ts
  marks.ts

src/components/performance/
  WebVitalsReporter.tsx

src/components/layout/PerformanceDashboard/
  index.tsx
  style.module.scss

app/api/performance/route.ts
app/(home)/performance/page.tsx
```

## 第一版性能预算

```ts
export const PERFORMANCE_BUDGET = {
  LCP: 2500,
  INP: 200,
  CLS: 0.1,
  api_request_ms: 1000,
  open_note_ms: 800,
  save_note_ms: 500,
  search_ms: 500,
  ai_first_token_ms: 1500,
};
```

Dashboard 中超过预算的指标标为 warning 或 poor。

## 实施步骤

1. 新增 `src/lib/performance`，实现事件类型、路由脱敏、设备识别、预算评级和统一上报。
2. 新增 `/api/performance`，支持写入性能事件和查询聚合数据。
3. 在 `app/layout.tsx` 挂载 `WebVitalsReporter`，接入 Web Vitals。
4. 在 `src/lib/http.ts` 的 axios interceptor 记录 API 请求耗时。
5. 在 `src/hooks/common/useAIChatStream.ts` 记录 AI 开始、首 token、完成、取消、失败和重试。
6. 为编辑器 ready、搜索等高频交互补充手动埋点。
7. 新增 `/performance` Dashboard，展示 P75、慢请求和预算状态。
8. 运行 lint 或 build，确认类型和构建可通过。

## 面试表达

可以将该工具总结为：

> 我为 AI 笔记助手实现了一个轻量级性能检测工具，不只是接入 Web Vitals，还针对 AI 产品体验设计了首 token、完整生成、取消率、重试率等业务指标，并通过 route 脱敏和字段白名单避免上传用户笔记内容，最后在内部 Dashboard 中用 P75 和性能预算判断体验是否达标。
