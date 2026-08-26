# HAHA-Note AI 对话自定义工具接入方案

> 文档版本：1.0  
> 编写日期：2026-08-26  
> 目标：将当前基于 Vercel AI SDK 的对话链路，平滑迁移为项目自封装的 AI 工具层  
> 范围：仅方案设计，不包含代码修改

## 1. OpenSpec 草案

### 1.1 现状

当前 AI 对话不是单点调用，而是一条完整链路：

- 前端状态与流式控制：`/Users/mia.hou/Documents/learn-a/HAHA-Note/src/hooks/common/useAIChatStream.ts`
- 会话页面消费：`/Users/mia.hou/Documents/learn-a/HAHA-Note/src/components/layout/AIChat/index.tsx`
- 主对话接口：`/Users/mia.hou/Documents/learn-a/HAHA-Note/app/api/chat-detail/route.ts`
- 文档摘要接口：`/Users/mia.hou/Documents/learn-a/HAHA-Note/app/api/docs-summary/[docsId]/route.ts`

当前依赖点包括：

- `useChat` / `DefaultChatTransport`
- `streamText`
- `generateText`
- `UIMessage`
- `convertToModelMessages`

这意味着真正需要替换的不是“模型调用”本身，而是整套协议与适配层。

### 1.2 目标

迁移后，项目应拥有自己的 AI 工具层，至少包含：

- 自定义消息协议
- 自定义流式协议
- 自定义请求/响应封装
- 自定义停止、重试、错误、完成事件
- 与现有 MongoDB 持久化逻辑兼容

### 1.3 目标结构

建议新增一层内部 AI 模块，例如：

- `src/lib/ai/client.ts`
- `src/lib/ai/chat.ts`
- `src/lib/ai/summary.ts`
- `src/lib/ai/types.ts`

对外只暴露项目自己的方法，不再让页面直接依赖 AI SDK。

### 1.4 前端替换方向

把 `useAIChatStream` 从 AI SDK hook 改为项目自定义 hook：

- 保留现有返回形状尽量不变：`messages / status / sendMessage / setMessages / stopStream / retryStream`
- 内部改为 `fetch` + `ReadableStream` 或 SSE
- 自动重试、首 token 统计、取消生成、完成回调继续保留

### 1.5 后端替换方向

把 `chat-detail` 和 `docs-summary` 从 AI SDK 调用改成自封装服务：

- 对话流：项目自己的流式输出
- 摘要：项目自己的普通请求封装
- 标题生成、摘要生成、会话落库逻辑继续沿用

## 2. Grill-me 边界清单

### 2.1 必须稳定的边界

1. 流式协议必须稳定
   - 前端必须知道“增量内容”“结束”“错误”“中断”分别代表什么。
2. 完成事件必须稳定
   - 当前标题、摘要、会话写库依赖 `onFinish`。
3. 停止与异常必须分开
   - 用户点击停止和网络断开不能共用一类状态。
4. 重试次数必须可观测
   - 现有自动重试 2 次的语义要完整保留。
5. 历史数据格式必须兼容
   - `AiMissionMessage` / `AiMissionPart` 不建议立刻改。

### 2.2 容易出问题的地方

- 直接替换掉 `useChat` 但没补齐消息状态机。
- 只改后端流式接口，前端依旧按 AI SDK 协议解析。
- 忽略 `onFinish`，导致会话无法正确落库。
- 将摘要逻辑和聊天流硬塞进一个接口，后期难拆。
- 先删依赖再迁移，导致回退成本过高。

### 2.3 不建议的做法

- 不建议一次性全量替换前后端。
- 不建议先改数据结构再改协议。
- 不建议把自定义工具直接写散在页面和 route 里。

## 3. 最终方案

### 3.1 推荐路径

采用分三阶段迁移：

1. 先抽象内部 AI adapter，外部接口不变。
2. 再把前端 hook 从 AI SDK 替换为自定义实现。
3. 最后把后端 `streamText/generateText` 替换掉，并清理依赖。

### 3.2 迁移顺序

1. 定义内部消息与流式协议。
2. 封装服务层。
3. 替换前端 hook。
4. 替换后端 route。
5. 保留一段时间兼容校验。
6. 删除 AI SDK 依赖。

### 3.3 验收标准

- 会话发送、停止、重试、恢复都可用。
- 首 token、总耗时、失败态仍然可观测。
- 文档摘要与会话标题生成正常。
- MongoDB 历史会话能正常读取和写回。
- 不再直接依赖 Vercel AI SDK 的对外 API。

### 3.4 结论

最稳妥的做法不是“替换库”，而是“先立协议，再换实现”。这样可以把风险集中在适配层，而不是把整个 AI 对话链路一次性掀翻。

