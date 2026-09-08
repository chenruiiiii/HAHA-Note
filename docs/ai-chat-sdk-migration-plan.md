# HAHA-Note AI 对话自定义工具实施方案

> 文档版本：3.0  
> 编写日期：2026-08-27  
> 目标：将当前基于 Vercel AI SDK 的 AI 对话链路，迁移为项目自封装工具层  
> 客户端流式方案：`@microsoft/fetch-event-source`  
> 取消请求方案：`AbortController`  
> 范围：实施方案文档，不包含代码修改

> 后续硬化执行入口：[ai-chat-hardening-trellis-plan.md](./ai-chat-hardening-trellis-plan.md)

## 1. OpenSpec Change

### 1.1 Change ID

`replace-ai-sdk-with-custom-fetch-event-source`

### 1.2 背景

当前 AI 对话链路依赖 Vercel AI SDK：

- 前端使用 `@ai-sdk/react` 的 `useChat`
- 前端使用 `ai` 包里的 `DefaultChatTransport`
- 后端使用 `ai` 包里的 `streamText` / `generateText`
- 后端使用 `@ai-sdk/deepseek` 创建 DeepSeek provider
- 页面层仍直接引用 `UIMessage`

这些依赖让业务代码和 AI SDK 的消息协议、流式协议、hook 状态机绑定在一起。后续如果要接入自研封装、多个 provider、统一网关、请求审计或更细的取消/重试策略，继续让页面依赖 AI SDK 会越来越难维护。

### 1.3 目标

迁移后，业务层只依赖 HAHA-Note 自己定义的 AI 协议和工具方法：

- 自定义消息类型
- 自定义 SSE 事件协议
- 自定义 provider client
- 自定义前端 hook 状态机
- 自定义取消、重试、错误处理和完成回调

### 1.4 非目标

本次迁移不做：

- 不改 MongoDB 存储结构。
- 不迁移历史会话数据。
- 不重写 AIChat 页面视觉层。
- 不引入 LangChain、Mastra 等更重的 agent 框架。
- 不把文档摘要和聊天流合并成同一个业务接口。

## 2. 当前依赖面

需要重点处理的文件：

- `/Users/mia.hou/Documents/learn-a/HAHA-Note/src/hooks/common/useAIChatStream.ts`
- `/Users/mia.hou/Documents/learn-a/HAHA-Note/src/components/layout/AIChat/index.tsx`
- `/Users/mia.hou/Documents/learn-a/HAHA-Note/app/api/chat-detail/route.ts`
- `/Users/mia.hou/Documents/learn-a/HAHA-Note/app/api/docs-summary/[docsId]/route.ts`
- `/Users/mia.hou/Documents/learn-a/HAHA-Note/src/models/ai-mission.ts`

当前依赖包：

- `ai`
- `@ai-sdk/react`
- `@ai-sdk/deepseek`

目标新增依赖：

- `@microsoft/fetch-event-source`

## 3. 最终技术方案

### 3.1 客户端流式方案

使用 `@microsoft/fetch-event-source`，不使用原生 `EventSource`。

选择原因：

- 原生 `EventSource` 只适合简单 `GET` 订阅。
- 当前聊天接口需要 `POST` 请求体传递 `chatId` 和 `messages`。
- `fetchEventSource` 支持 `POST`、headers、body、credentials 和 `AbortController.signal`。
- 可以在 `onopen`、`onmessage`、`onerror`、`onclose` 中显式接管状态机。

### 3.2 取消请求方案

前端每次发起请求时创建一个新的 `AbortController`：

```ts
const controller = new AbortController();

await fetchEventSource('/api/chat-detail', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ chatId, messages }),
  signal: controller.signal,
  onmessage(event) {
    // parse SSE event
  },
});
```

用户点击停止生成时：

```ts
controller.abort();
```

停止后必须重置 controller，下一次发送或重试不能复用已经 aborted 的 signal。

### 3.3 服务端流式方案

`app/api/chat-detail/route.ts` 返回标准 SSE 响应：

```txt
Content-Type: text/event-stream; charset=utf-8
Cache-Control: no-cache, no-transform
Connection: keep-alive
```

服务端将上游模型流翻译成项目自己的 SSE 事件：

```txt
event: start
data: {"requestId":"..."}

event: delta
data: {"text":"增量内容"}

event: finish
data: {"messages":[...]}

event: error
data: {"message":"错误信息","retryable":true}
```

### 3.4 上游模型调用

后端自封装 provider client，使用 `fetch` 直接请求 DeepSeek 的 OpenAI-compatible chat completions 接口。

建议保留这些配置：

- `DEEPSEEK_API_KEY`
- `AI_PROVIDER_BASE_URL`
- `AI_CHAT_MODEL`
- `AI_SUMMARY_MODEL`

默认值可以先沿用当前模型：`deepseek-chat`。

## 4. 内部协议

### 4.1 消息协议

继续兼容当前 `AiMissionMessage` / `AiMissionPart` 的存储形状：

```ts
type AiRole = 'system' | 'user' | 'assistant';

type AiTextPart = {
  type: 'text';
  text: string;
};

type AiMarkdownPart = {
  type: 'markdown';
  markdown: string;
};

type AiImageUrlPart = {
  type: 'image_url';
  image_url: {
    url: string;
    alt?: string;
    width?: number;
    height?: number;
  };
};

type AiChatPart = AiTextPart | AiMarkdownPart | AiImageUrlPart;

type AiChatMessage = {
  id: string;
  role: AiRole;
  parts: AiChatPart[];
};
```

### 4.2 请求协议

```ts
type ChatRequest = {
  chatId: string;
  messages: AiChatMessage[];
};

type TextGenerationRequest = {
  prompt: string;
  model?: string;
};
```

### 4.3 SSE 事件协议

```ts
type ChatStreamEvent =
  | { type: 'start'; requestId: string }
  | { type: 'delta'; text: string }
  | { type: 'finish'; messages: AiChatMessage[] }
  | { type: 'error'; message: string; retryable: boolean }
  | { type: 'heartbeat' };
```

约定：

- `start`：服务端已接受请求。
- `delta`：模型返回的增量文本。
- `finish`：服务端完成最终消息拼接并已触发落库流程。
- `error`：服务端捕获异常，前端根据 `retryable` 判断是否自动重试。
- `heartbeat`：长连接保活，不渲染到消息列表。

## 5. 建议新增文件

### 5.1 通用类型

`/Users/mia.hou/Documents/learn-a/HAHA-Note/src/lib/ai/types.ts`

职责：

- 定义 `AiChatMessage`
- 定义 `ChatRequest`
- 定义 `ChatStreamEvent`
- 定义 provider 请求和响应类型

### 5.2 provider client

`/Users/mia.hou/Documents/learn-a/HAHA-Note/src/lib/ai/client.ts`

职责：

- 读取 provider 配置
- 统一拼接请求头
- 调用 DeepSeek chat completions
- 支持普通文本生成
- 支持流式文本生成
- 接收 `AbortSignal`

### 5.3 对话服务

`/Users/mia.hou/Documents/learn-a/HAHA-Note/src/lib/ai/chat.ts`

职责：

- 把 `AiChatMessage[]` 转成 provider message
- 读取上游 SSE 流
- 提取 delta 文本
- 拼接 assistant 最终消息
- 输出项目自己的 `ChatStreamEvent`

### 5.4 摘要服务

`/Users/mia.hou/Documents/learn-a/HAHA-Note/src/lib/ai/summary.ts`

职责：

- 生成文档摘要
- 生成会话标题
- 生成会话摘要
- 替换当前 `generateText`

### 5.5 SSE 工具

`/Users/mia.hou/Documents/learn-a/HAHA-Note/src/lib/ai/sse.ts`

职责：

- 编码 SSE event
- 编码 heartbeat
- 创建 `ReadableStream`
- 统一 error event 格式

### 5.6 前端流式客户端

`/Users/mia.hou/Documents/learn-a/HAHA-Note/src/lib/ai/fetch-event-source-client.ts`

职责：

- 封装 `fetchEventSource`
- 传入 `AbortController.signal`
- 解析 `event.event` 和 `event.data`
- 将 SSE event 转成 hook 可消费的回调

## 6. 实施步骤

### Phase 1. 引入 fetch-event-source

目标：准备客户端流式能力。

执行项：

1. 安装 `@microsoft/fetch-event-source`。
2. 新建 `src/lib/ai/types.ts`。
3. 新建 `src/lib/ai/fetch-event-source-client.ts`。
4. 暂时不删除 AI SDK。

验收：

- 项目可以正常安装依赖。
- 新增类型不影响现有构建。

### Phase 2. 抽象内部 AI 类型

目标：隔离 `UIMessage`。

执行项：

1. 将页面和 hook 的消息类型迁移到 `AiChatMessage`。
2. 保留当前 `AiMissionMessage` 兼容格式。
3. 增加必要的转换函数，兼容历史数据。

验收：

- `AIChat/index.tsx` 不再直接 import `UIMessage`。
- 历史会话仍可正常渲染。

### Phase 3. 封装后端 provider client

目标：替换 `@ai-sdk/deepseek`。

执行项：

1. 新建 `src/lib/ai/client.ts`。
2. 用原生 `fetch` 调 DeepSeek OpenAI-compatible 接口。
3. 普通请求用于标题、会话摘要、文档摘要。
4. 流式请求用于聊天回复。
5. provider client 接收 `AbortSignal`，并把 `request.signal` 透传到上游。

验收：

- 不使用 `createDeepSeek` 也能拿到普通文本结果。
- 上游请求可以被 abort。

### Phase 4. 改造聊天 route 为 SSE

目标：替换 `streamText`。

执行项：

1. `app/api/chat-detail/route.ts` 继续接收 `{ chatId, messages }`。
2. 请求开始时先保存用户消息。
3. 返回 `text/event-stream`。
4. 服务端读取 provider 流，并输出项目 SSE event。
5. 服务端拼接 assistant 最终消息。
6. `finish` 前后触发标题、摘要、最终消息落库。
7. 捕获异常并输出 `event: error`。

验收：

- 前端可以收到 `start / delta / finish / error`。
- 正常完成时会话完整落库。
- 异常时不会写入半截错误消息作为最终回答。

### Phase 5. 改造前端 hook

目标：替换 `useChat` 和 `DefaultChatTransport`。

执行项：

1. 在 `useAIChatStream.ts` 中移除 `useChat`。
2. 每次 `sendMessage` 创建新的 `AbortController`。
3. 使用 `fetchEventSource` 发起 `POST /api/chat-detail`。
4. `onopen` 时设置 `submitted`。
5. 收到首个 `delta` 时设置 `streaming` 并记录首 token 时间。
6. 收到 `delta` 时增量更新最后一条 assistant message。
7. 收到 `finish` 时设置 `success`，调用 `onPersisted`。
8. `stopStream` 调用 `abortController.abort()`，并设置 `aborted`。
9. `retryStream` 重新创建 controller，并重新发送最后一轮请求。

验收：

- 发送消息可用。
- 停止生成可用。
- 停止后再次发送可用。
- 自动重试不复用旧 signal。
- 性能埋点仍然记录首 token 和总耗时。

### Phase 6. 改造摘要 route

目标：替换 `generateText`。

执行项：

1. `docs-summary/[docsId]/route.ts` 调用 `src/lib/ai/summary.ts`。
2. `chat-detail/route.ts` 中的标题和会话摘要也复用 `summary.ts`。
3. 保留原有失败回退策略。

验收：

- 文档摘要接口仍返回 `{ code, data: { summary }, message }`。
- 会话标题生成失败时仍能回退到首条用户消息。
- 会话摘要生成失败时仍能回退到截断文本。

### Phase 7. 清理 AI SDK 依赖

目标：彻底移除 Vercel AI SDK。

执行项：

1. 删除 `ai`。
2. 删除 `@ai-sdk/react`。
3. 删除 `@ai-sdk/deepseek`。
4. 清理 lockfile。
5. 运行 lint 和 build。

验收：

- `rg "@ai-sdk|from 'ai'|from \"ai\"" src app` 无业务引用。
- `pnpm lint` 通过。
- `pnpm build` 通过。

## 7. AbortController 细节

### 7.1 controller 生命周期

建议在 `useAIChatStream` 中维护：

```ts
const abortControllerRef = useRef<AbortController | null>(null);
```

每次请求：

```ts
abortControllerRef.current?.abort();
abortControllerRef.current = new AbortController();
```

请求结束：

```ts
abortControllerRef.current = null;
```

用户停止：

```ts
abortControllerRef.current?.abort();
abortControllerRef.current = null;
```

### 7.2 自动重试

自动重试时必须创建新的 controller：

```ts
abortControllerRef.current = new AbortController();
```

不能复用旧 signal，因为 aborted signal 会让后续请求立即失败。

### 7.3 服务端中断

服务端 route 应使用 `request.signal`：

```ts
await fetch(providerUrl, {
  method: 'POST',
  signal: request.signal,
});
```

这样用户前端 abort 后，上游 provider 请求也能尽快停止，避免继续消耗 token。

## 8. Grill-me 边界检查

### 8.1 fetch-event-source 的边界

- `fetchEventSource` 不是模型 SDK，它只解决客户端 SSE 消费。
- provider 调用仍要由后端自封装。
- 前端不应该直接请求 DeepSeek，API key 必须留在服务端。

### 8.2 原生 EventSource 不适合当前场景

- 原生 `EventSource` 主要是 `GET`。
- 当前聊天发送需要 `POST` body。
- 当前逻辑需要 abort、重试、鉴权 headers 和错误状态控制。

### 8.3 取消请求的边界

- 前端 abort 代表用户主动停止。
- 网络断开不是用户主动停止。
- 用户主动停止后不应该触发自动重试。
- 网络断开或 retryable error 才进入自动重试。

### 8.4 落库边界

- 请求开始时可以保存用户消息。
- assistant 最终消息只在 `finish` 时落库。
- abort 时不应该把半截 assistant 消息当成最终回答落库。
- 如果产品想保留半截内容，需要单独设计 `status: aborted` 的消息状态。

### 8.5 重试边界

- 自动重试最多保持当前的 2 次。
- 每次重试都要重建 `AbortController`。
- 重试前要清理上一轮的临时 assistant message。
- 重试成功后只保留最终成功的 assistant message。

## 9. 风险与回滚

### 9.1 主要风险

- SSE event 编码不规范，导致前端解析失败。
- provider 流式格式和项目 SSE 格式混在一起。
- abort 后状态被误判为 error。
- finish 事件发出前落库失败。
- 页面增量更新最后一条 assistant message 时出现重复文本。

### 9.2 回滚策略

建议分阶段提交：

1. 先提交类型和封装，不切流量。
2. 再提交后端 SSE route。
3. 再提交前端 hook 替换。
4. 最后提交依赖删除。

如果出问题，优先回滚前端 hook 替换，让 route 可以继续兼容旧实现一段时间。

## 10. 最终验收清单

- 已安装 `@microsoft/fetch-event-source`。
- 前端不再使用 `useChat`。
- 前端不再使用 `DefaultChatTransport`。
- 前端取消请求使用 `AbortController`。
- 停止生成后不会自动重试。
- 自动重试会创建新的 `AbortController`。
- 后端不再使用 `streamText`。
- 后端不再使用 `generateText`。
- 后端不再使用 `createDeepSeek`。
- 聊天接口返回标准 SSE。
- 标题生成正常。
- 文档摘要生成正常。
- 会话摘要生成正常。
- MongoDB 历史消息兼容。
- `pnpm lint` 通过。
- `pnpm build` 通过。

## 11. 参考

- `@microsoft/fetch-event-source`：支持基于 Fetch API 的 SSE 客户端能力，包括自定义 method、headers、body 和 signal。
- DeepSeek API：继续按 OpenAI-compatible chat completions 方式封装，具体 base URL 与模型名以当前环境变量为准。
