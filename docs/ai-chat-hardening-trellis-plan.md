# HAHA-Note AI Chat Hardening 完整实施文档

> OpenSpec 输出：基于现有迁移方案，进一步细化为可执行的硬化蓝图

> 基线来源：`feat/ai-chat-hardening` 分支与当前工作区代码扫描  
> 目标：把现有 AI 对话链路补成“可流式、可恢复、可分层、可持久化”的完整系统  
> 适用范围：AI Chat、文档摘要、后续所有长任务型 AI 能力

> 关联方案：[ai-chat-sdk-migration-plan.md](./ai-chat-sdk-migration-plan.md)

## 1. 先说结论

当前 `HAHA-Note` 的 AI Chat 已经有这些基础：

- `useChat` + `DefaultChatTransport` 的流式聊天接入
- 基础的提交 / 取消 / 手动重试
- 请求状态 `submitted / streaming / retrying / ready / success / aborted / error`
- 服务端对话内容落库到 MongoDB
- 文档摘要接口已经有“生成 + 持久化”的闭环

但还没有做到你要的这几层：

- 自定义流协议
- 流式状态机分离
- 快照恢复 + 增量合并
- 历史 / 当前输入 / 附件 / 工具结果分层
- Prompt 模块化
- 更细粒度的失败后手动恢复
- 真正意义上的会话持久化与续接

## 2. 当前现状扫描

### 2.1 前端聊天主链路

`src/hooks/common/useAIChatStream.ts` 目前还是基于 AI SDK：

- `useChat`
- `DefaultChatTransport`
- 通过 `onError`、`onFinish`、`status` 驱动状态
- 带有自动重试和埋点

这说明现在的“流式能力”是接上了，但状态机仍然绑定在 SDK 语义里。

### 2.2 页面层

`src/components/layout/AIChat/index.tsx` 负责：

- 载入会话详情
- 渲染消息
- 监听 `submitted` / `ready`
- 处理发送、停止、重新生成

但它仍然是“消息列表 + 播放状态”的写法，还没有把：

- 历史
- 当前输入
- 生成中的草稿
- 附件
- 工具结果

拆成独立层。

### 2.3 状态层

`src/store/modules/chat.ts` 现在只保存：

- `isPosting`
- `requestStatus`
- `lastError`
- `retryCount`

这是一个“够用”的 UI 状态切片，但还不够表达完整流式对话系统的状态边界。

### 2.4 服务端

`app/api/chat-detail/route.ts` 目前是：

- `streamText`
- `generateText`
- `convertToModelMessages`
- `toUIMessageStreamResponse`
- 最终把消息、标题、摘要写回 MongoDB

它已经有“生成后落库”，但还没有：

- 项目自定义 SSE 事件
- 自定义 provider client
- 可恢复的流会话协议

### 2.5 文档摘要

`app/api/docs-summary/[docsId]/route.ts` 说明项目已经在做：

- 文档总结
- 生成失败 fallback
- `persist` 模式下落库

这块很适合复用成“Prompt 模块化”和“长任务持久化”的样板。

## 3. 这次要补的六个能力

### 3.1 流式输出 + 状态机分离

现状：

- 流式已经有了
- 但状态主要靠 AI SDK 的 `status`
- 前端 UI 和底层流协议耦得比较紧

要补：

- 自定义 SSE 事件
- 自定义 request lifecycle
- 明确区分：
  - `idle`
  - `submitted`
  - `streaming`
  - `disconnect`
  - `retrying`
  - `finished`
  - `aborted`
  - `failed`

### 3.2 快照恢复 + 增量合并

现状：

- 会话详情可以重新加载
- 但更像“整包重置”

要补：

- 首先拉服务端快照
- 再只合并增量
- 对流式中的长回复做“回退保护”
- 支持 `after_seq` / `resume_token`

### 3.3 历史、当前输入、附件、工具结果分层

现状：

- 消息和部分附件能力都在页面里
- 但还是偏单层拼装

要补：

- `conversation history`
- `draft input`
- `attachments`
- `tool results`
- `runtime stream parts`

各自独立存，独立渲染，独立持久化。

### 3.4 Prompt 模块化

现状：

- `chat-detail` 和 `docs-summary` 里都在写内联 prompt

要补：

- prompt 模板抽离
- system / task / style / output format 分开
- prompt 版本号和变更记录
- 不同任务共用同一套 prompt registry

### 3.5 失败后可手动恢复

现状：

- 已有自动重试
- 已有 `retryStream`
- 已有错误 banner

要补：

- 明确“断线重试”和“业务失败重试”的区别
- 失败后保留现场
- 手动 retry 时能重新挂回同一会话上下文
- 对无法自动恢复的错误给出明确 CTA

### 3.6 会话持久化

现状：

- 最终消息会落 MongoDB
- 但对“运行中状态”“半条消息”“恢复 token”“草稿输入”的持久化还不完整

要补：

- 会话元数据
- 消息版本
- 流式进度
- 运行中任务状态
- 可恢复的断点信息

## 4. 推荐目标架构

```text
用户输入
  -> draft / attachment / history 组装
  -> 自定义 chat request
  -> SSE start / delta / finish / error
  -> 前端状态机更新
  -> 快照合并
  -> 持久化会话 / 消息 / 附件 / 工具结果
```

### 4.1 建议的状态模型

```ts
type ChatRequestState =
  | 'idle'
  | 'submitted'
  | 'streaming'
  | 'retrying'
  | 'disconnect'
  | 'finished'
  | 'aborted'
  | 'failed';
```

### 4.2 建议的消息分层

```ts
type ChatConversation = {
  id: string;
  title: string;
  summary?: string;
  status: 'active' | 'archived';
  updatedAt: string;
};

type ChatMessage = {
  id: string;
  conversationId: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  parts: ChatPart[];
  status?: 'pending' | 'streaming' | 'completed' | 'failed';
};

type ChatAttachment = {
  id: string;
  conversationId: string;
  messageId?: string;
  kind: 'image' | 'file' | 'audio' | 'video';
  url: string;
};

type ChatToolRun = {
  id: string;
  conversationId: string;
  messageId?: string;
  name: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  result?: unknown;
};
```

## 5. 文件级落地建议

### 5.1 新增通用协议层

- `src/lib/ai/types.ts`
- `src/lib/ai/prompt.ts`
- `src/lib/ai/events.ts`
- `src/lib/ai/snapshot.ts`

职责：

- 定义消息协议
- 定义 SSE 事件协议
- 定义 prompt 模板
- 定义快照合并逻辑

### 5.2 新增 provider client

- `src/lib/ai/client.ts`

职责：

- 统一请求头
- 统一超时和取消
- 支持多 provider
- 支持流式与非流式调用

### 5.3 重写聊天服务

- `app/api/chat-detail/route.ts`

职责：

- 接收自定义请求体
- 返回标准 SSE
- 输出 `start / delta / finish / error`
- 完成落库

### 5.4 重写前端流 hook

- `src/hooks/common/useAIChatStream.ts`

职责：

- 管理前端状态机
- 管理 AbortController
- 管理手动重试
- 管理断线恢复
- 管理首次 token、完成、失败埋点

### 5.5 改造状态切片

- `src/store/modules/chat.ts`

职责：

- 保存更丰富的 chat runtime state
- 区分发送中、恢复中、失败、可重试
- 支持恢复后的 UI 回填

## 6. 当前分支里还没做的点

下面这些是你现在最明确的缺口：

1. 还在用 `useChat` / `DefaultChatTransport`，不是自定义流协议。
2. 还没有 `fetch-event-source` 这一层。
3. 还没有项目自己的 SSE 事件 schema。
4. 还没有快照恢复 + `after_seq` 增量合并。
5. 还没有把历史、输入、附件、工具结果分层。
6. 还没有 Prompt registry / versioning。
7. 还没有工具调用闭环。
8. 还没有运行中会话的断点恢复存储。

## 7. 推荐实施顺序

### Phase 1

- 抽协议
- 抽 prompt
- 抽状态机

### Phase 2

- 改前端 hook
- 改服务端 SSE
- 加取消与重试统一处理

### Phase 3

- 做快照恢复
- 做消息增量合并
- 做会话持久化

### Phase 4

- 上工具调用
- 上附件分层
- 上更细的失败态和回放能力

## 8. 验收标准

满足以下条件，才算这次 hardening 真正完成：

- 页面刷新后能恢复到上一次会话状态
- 断线后能重新挂回同一条流
- 手动重试不会重复提交
- 失败态不会把半条消息覆盖成旧快照
- 历史、输入、附件、工具结果互不污染
- prompt 可以独立演进
- SSE 事件和前端状态机可以单独排查

## 9. 简历可沉淀亮点

- 设计并实现流式 AI 对话状态机，支持提交、生成、断线、重试、失败和取消等完整生命周期。
- 搭建快照恢复与增量合并机制，支持长对话刷新后续接，避免旧快照覆盖流式结果。
- 实现会话、消息、附件与工具结果分层存储，提升对话系统的回放和持久化能力。
- 抽离 Prompt 模块与输出协议，提升多任务 AI 能力的复用和可维护性。
- 建立失败后可手动恢复的降级策略，减少长任务中断带来的状态错乱。
