# HAHA-Note AI 对话自定义工具实施方案

> 文档版本：2.0  
> 编写日期：2026-08-26  
> 目标：替换当前 Vercel AI SDK 依赖，改为项目自封装的 AI 工具层  
> 范围：仅实施方案，不改代码

## 1. 目标

把现在这条链路：

- `useChat`
- `DefaultChatTransport`
- `streamText`
- `generateText`
- `UIMessage`

替换成项目自己的实现，同时保留现有产品行为：

- 会话流式输出
- 停止生成
- 自动重试
- 首 token / 总耗时统计
- 会话标题生成
- 文档摘要生成
- MongoDB 落库格式兼容

## 2. 现有依赖面

相关文件如下：

- `/Users/mia.hou/Documents/learn-a/HAHA-Note/src/hooks/common/useAIChatStream.ts`
- `/Users/mia.hou/Documents/learn-a/HAHA-Note/src/components/layout/AIChat/index.tsx`
- `/Users/mia.hou/Documents/learn-a/HAHA-Note/app/api/chat-detail/route.ts`
- `/Users/mia.hou/Documents/learn-a/HAHA-Note/app/api/docs-summary/[docsId]/route.ts`

当前耦合点：

- 前端依赖 AI SDK 的 hook 和 transport
- 后端依赖 AI SDK 的流式响应封装
- 页面层还在引用 `UIMessage`
- 存储层已经使用自定义 `AiMissionMessage`，这部分可以保留

## 3. 设计原则

1. 先抽象协议，再替换实现。
2. 前端接口尽量不变。
3. 存储格式尽量不变。
4. 流式、重试、取消语义必须明确。
5. 先兼容运行，再清理依赖。

## 4. 新增内部协议

建议新增一层项目自有类型，不再把 AI SDK 类型暴露到业务层。

### 4.1 消息协议

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

type AiImagePart = {
  type: 'image_url';
  image_url: {
    url: string;
    alt?: string;
    width?: number;
    height?: number;
  };
};

type AiChatPart = AiTextPart | AiMarkdownPart | AiImagePart;

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

type SummaryRequest = {
  docsId: string;
  title?: string;
  contentHtml?: string;
  persist?: boolean;
};
```

### 4.3 流式协议

建议使用 NDJSON，而不是直接绑 AI SDK 的消息流。

```ts
type StreamEvent =
  | { type: 'start'; requestId: string }
  | { type: 'delta'; text: string }
  | { type: 'finish'; messages: AiChatMessage[] }
  | { type: 'error'; message: string; retryable?: boolean }
  | { type: 'heartbeat' };
```

这样前端能明确区分：

- 正在生成
- 增量内容
- 正常结束
- 网络中断
- 用户主动停止

## 5. 文件级实施方案

### 5.1 新增文件

建议新增：

- `/Users/mia.hou/Documents/learn-a/HAHA-Note/src/lib/ai/types.ts`
- `/Users/mia.hou/Documents/learn-a/HAHA-Note/src/lib/ai/client.ts`
- `/Users/mia.hou/Documents/learn-a/HAHA-Note/src/lib/ai/chat.ts`
- `/Users/mia.hou/Documents/learn-a/HAHA-Note/src/lib/ai/summary.ts`
- `/Users/mia.hou/Documents/learn-a/HAHA-Note/src/lib/ai/stream-parser.ts`
- `/Users/mia.hou/Documents/learn-a/HAHA-Note/src/lib/ai/convert.ts`

### 5.2 修改文件

需要改动：

- `/Users/mia.hou/Documents/learn-a/HAHA-Note/src/hooks/common/useAIChatStream.ts`
- `/Users/mia.hou/Documents/learn-a/HAHA-Note/src/components/layout/AIChat/index.tsx`
- `/Users/mia.hou/Documents/learn-a/HAHA-Note/app/api/chat-detail/route.ts`
- `/Users/mia.hou/Documents/learn-a/HAHA-Note/app/api/docs-summary/[docsId]/route.ts`

### 5.3 保留不动的部分

建议先保留：

- `/Users/mia.hou/Documents/learn-a/HAHA-Note/src/models/ai-mission.ts`
- `/Users/mia.hou/Documents/learn-a/HAHA-Note/src/store/modules/chat.ts`
- `/Users/mia.hou/Documents/learn-a/HAHA-Note/src/hooks/common/useHaChat.ts`

原因是它们已经承载了 UI 状态和持久化格式，没有必要在第一阶段一起重写。

## 6. 实施步骤

### Phase 1. 抽协议

目标：先把 AI SDK 类型隔离出去。

执行项：

1. 在 `src/lib/ai/types.ts` 定义内部消息、请求、流事件类型。
2. 在 `src/lib/ai/convert.ts` 里写 AI SDK 兼容转换器。
3. 让路由和 hook 先依赖内部类型，不直接依赖 `ai` 包类型。

验收：

- 业务代码中不再新增 `UIMessage` 依赖。
- 现有消息存储结构不变。

### Phase 2. 抽 provider client

目标：把模型调用封进一个普通服务类。

执行项：

1. 在 `src/lib/ai/client.ts` 封装 provider 请求。
2. 在 `src/lib/ai/chat.ts` 封装流式对话。
3. 在 `src/lib/ai/summary.ts` 封装标题/摘要生成。
4. 保留当前 DeepSeek 模型配置，但实现方式改为自己的封装，不再用 AI SDK。

验收：

- 后端仍能拿到文本输出。
- 标题与摘要逻辑结果与当前一致或近似一致。

### Phase 3. 改后端 route

目标：让 API route 不再依赖 AI SDK。

执行项：

1. `chat-detail/route.ts` 改为调用 `src/lib/ai/chat.ts`。
2. 继续保留 `saveChatDetail`、标题生成、摘要生成逻辑。
3. `docs-summary/[docsId]/route.ts` 改为调用 `src/lib/ai/summary.ts`。
4. 把返回格式统一成项目自己的 JSON / NDJSON 协议。

验收：

- 聊天接口仍可正常流式返回。
- 文档摘要接口仍可正常返回 summary。
- MongoDB 写入不变。

### Phase 4. 改前端 hook

目标：把 `useChat` 替换为项目自定义 hook。

执行项：

1. `useAIChatStream.ts` 改为基于 `fetch` + `ReadableStream` 读取 NDJSON。
2. 保留现有状态机：`submitted / streaming / retrying / ready / error / aborted`。
3. 保留自动重试 2 次。
4. 保留 `stopStream` 和 `retryStream`。
5. 保留性能埋点。

验收：

- 页面发送、停止、重试都正常。
- 首 token 统计不丢。
- 断线后重试逻辑可继续工作。

### Phase 5. 清理 UI 类型引用

目标：移除页面层对 AI SDK 的直接依赖。

执行项：

1. `AIChat/index.tsx` 改用本地 `AiChatMessage` 类型。
2. 去掉 `UIMessage` 相关 cast。
3. 确保历史消息回放仍能正常渲染图片和文本。

验收：

- 页面不再导入 `ai` 包类型。
- 历史会话可正常打开。

### Phase 6. 删除旧依赖

目标：彻底切掉 Vercel AI SDK。

执行项：

1. 删除 `ai`、`@ai-sdk/react`、`@ai-sdk/deepseek` 相关依赖。
2. 清理无用 import。
3. 运行 lint 和 build。

验收：

- 项目可构建通过。
- 不再存在 AI SDK 运行时依赖。

## 7. 边界和风险

### 7.1 必须保留的语义

- 用户手动停止要和异常中断分开。
- 自动重试不能无限循环。
- `onFinish` 对应的落库时机不能丢。
- 历史会话消息格式不能突然变。

### 7.2 不能同时做的事情

- 不建议在同一轮同时改协议、改存储、改 UI。
- 不建议先删依赖再迁移。
- 不建议把聊天流和摘要流塞进一个接口。

### 7.3 回滚策略

如果新实现出现问题，优先回退到 Phase 1 的兼容层，而不是回退整个页面。

## 8. 验收清单

- 发送消息成功
- 流式输出正常
- 停止按钮可用
- 重试按钮可用
- 断线自动重试可用
- 标题生成正常
- 摘要生成正常
- MongoDB 落库正常
- 构建通过
- 页面不再直接依赖 AI SDK 类型

## 9. 推荐结论

最稳的方案是：

1. 先写内部 AI 协议和适配器。
2. 再换后端实现。
3. 再换前端 hook。
4. 最后删掉 AI SDK 依赖。

这会比“直接整包替换”更稳，也更容易验证和回滚。

