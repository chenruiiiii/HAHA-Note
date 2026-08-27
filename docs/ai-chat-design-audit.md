# HAHA-Note AI 对话模块设计扫描与补充（OpenSpec + Grill-me）

> 编写日期：2026-08-27  
> 范围：仅扫描与设计评审，不做代码改动  
> 相关核心文件：`src/hooks/common/useAIChatStream.ts`、`src/hooks/common/useHaChat.ts`、`src/components/layout/AIChat/*`、`app/api/chat-detail/route.ts`、`src/store/modules/chat.ts`、`src/lib/mitt.ts`

## 现状链路速览

### 前端主链路

- 输入组件：`src/components/layout/AIWritingHome/components/ChatInput/index.tsx`
  - 调用 `useHaChat().handleSend(inputValue)`
  - 依据当前路由：
    - 在 `/ai-chat-home`：把输入存入 `redux.temp.value`，再 `router.push('/ai-chat/:id')`
    - 在 `/ai-chat/:id`：通过 `mitt` 广播 `chat-message` 事件
- 对话页：`src/components/layout/AIChat/index.tsx`
  - 使用 `useAIChatStream({ chatId, onPersisted })` 发起流式对话
  - `mitt` 订阅：
    - `chat-message` => `sendMessage({ text })`
    - `stop-send-message` => `stopStream()`
  - 对话状态横幅（错误、重试次数）：基于 redux `state.chat.{requestStatus,lastError,retryCount}`
- Hook：`src/hooks/common/useAIChatStream.ts`
  - 依赖 `@ai-sdk/react` 的 `useChat`
  - 通过 `DefaultChatTransport({ api:'/api/chat-detail', body:{chatId} })` 让请求 body 带上 `chatId`
  - 把 `useChat.status` 映射到 redux `chat` slice（`useEffect` 内 dispatch + `onFinish`/`stopStream`/`retryStream` 也 dispatch）
  - `onFinish` 遇到 `isDisconnect || isError` 会自动重试（有次数限制）

### 后端主链路

- Chat Stream Route：`app/api/chat-detail/route.ts`
  - 读取 `req.json()`：`{ chatId, messages }`
  - `await saveChatDetail(chatId, messages)` 先落库一次（保存用户消息 + 历史消息）
  - 调用 AI SDK：`streamText({ model: deepseek('deepseek-chat'), messages: await convertToModelMessages(messages) })`
  - `return result.toUIMessageStreamResponse({ originalMessages, onFinish })`
  - `onFinish`：生成标题 + 摘要并落库

### 数据结构

- 存储结构（MongoDB）：`AiMissionDetail`
  - `_id = chatId`
  - `types = AiMissionMessage[]`（含 parts：`text | markdown | image_url`）
- 最近会话列表：`latest_mission` 集合（仅 `docs_id/title`）

## 扫描结论：主要不合理点与风险

> 下面很多点与你提供的“问题清单”一致；此处补充的是：在当前代码实现中实际存在、且会导致错误或难以演进的部分（包括一些“隐藏 bug”）。

### 1) 关键逻辑疑似写反：`useOneRequest.checkDuplicate` 的使用方式

文件：`src/hooks/common/useOneRequest.ts`、`src/components/layout/AIChat/index.tsx`

- `checkDuplicate` 的实现：**不重复返回 `true`，重复返回 `false`**。
- 但在 AIChat 页的两处使用都写成了：
  - `if (!checkDuplicate(...)) sendMessage(...)`
- 这会导致：
  - 正常新消息（不重复）=> `checkDuplicate === true` => 不会 send
  - 同一条消息重复触发（在 5 分钟窗口内）=> `checkDuplicate === false` => 反而会 send

影响：这不是“体验瑕疵”，而是**对话发送的主链路可能根本无法按预期工作**（除非运行时路径与你看到的代码不一致）。

建议：把 hook 命名与返回值语义改清晰（例如 `isDuplicate()` 返回 `true` 表示重复），并统一调用方式；至少先修正当前两处判断条件。

### 2) Redux `chat` slice 为全局单例，且卸载时全量 reset

文件：`src/store/modules/chat.ts`、`src/hooks/common/useAIChatStream.ts`

- `chat` slice 只有一份全局状态：`isPosting/requestStatus/lastError/retryCount`
- `useAIChatStream` 的卸载 effect 会 `dispatch(resetChatRequestStateAction())`

影响：

- 多开两个会话页面（或未来加入 split view）时：A 卸载会把 B 的发送状态也清空。
- 这与“会话持久化 + 多模型切换 + 重试停止”目标冲突：后续任何增强都将被全局状态污染放大成本。

建议：

- **短期**：卸载时不要 reset 全局 chat 状态；改为只做 timer/controller 清理。
- **中期**：将 chat state 改成 `byId: Record<chatId, State>`，并提供 `removeChatState(chatId)`。

### 3) `useAIChatStream` 存在“多处写同一状态”的竞争条件

文件：`src/hooks/common/useAIChatStream.ts`

- 同一个 slice（`setChatRequestStateAction`）在至少两条路径写入：
  - `useEffect([status])` 内写入（submitted/streaming/ready/error）
  - `onFinish/stopStream/retryStream` 内也写入

影响：

- 状态机边界被打散，容易出现“本来 aborted 但被 useEffect 写回 ready/error”的覆盖。
- 当你引入“自动重试”“手动重试”“停止生成”“并发保护”时，问题会指数级变复杂。

建议：选定**唯一写入点**（通常是 action 驱动的 reducer 或者 hook 内一个统一状态机函数），避免 effect + 回调混写。

### 4) 自动重试策略过宽，且无法基于 HTTP 错误分级

文件：`src/hooks/common/useAIChatStream.ts`

- 当前策略：`(isDisconnect || isError) && retryCount < MAX_AUTO_RETRY` => 自动重试
- `isError` 可能包含：鉴权失败、参数校验失败、限流、上游 500 等

影响：

- 会把“业务不可重试”的错误当成“可重试”，产生额外 token/额度消耗。
- 由于前端拿不到 statusCode，只能靠后端透传错误语义才能做更好的策略。

建议（与原清单一致，补充落地方式）：

- 前端：自动重试仅针对 `isDisconnect`，`isError` 统一进入手动重试。
- 后端：对 401/429 等返回可读错误信息（不要返回 stack），并能在流式场景里让前端准确分辨（见后文 OpenSpec 方案）。

### 5) `onPersisted` 无 try/catch：持久化失败会中断收尾链路

文件：`src/hooks/common/useAIChatStream.ts`

`await onPersisted?.()` 当前未捕获异常。

影响：

- 持久化一旦抛错（例如接口 500 或 JSON parse 失败），会导致 `onFinish` 的后续收尾行为被打断（包括状态 reset、重试计数清理等）。

建议：对 `onPersisted` 包一层 try/catch，且不要影响状态机收尾。

### 6) `mitt` 全局事件总线：天然多实例串扰

文件：`src/lib/mitt.ts`、`src/hooks/common/useHaChat.ts`、`src/components/layout/AIChat/index.tsx`

现状：

- emitter 是单例
- event 没有携带 `chatId`，也没有做 instance 过滤

影响：

- 多开会话时会出现：所有对话页同时 stop、同时 send 的串扰。
- 目前 `PostingBox` 也依赖 `start-streaming/quit-streaming` 全局事件，会同样串扰。

建议：

- **短期**：事件 payload 带 `chatId` 并过滤（你提供的方案可行），并且把 `PostingBox` 事件也带上 `chatId`。
- **长期**：逐步移除 mitt，改用组件 props / Context（每个会话一份 context），或直接把 input 放到 chat 页内（减少跨组件通信）。

### 7) `stop` 的“真实终止”不完整：前端 stop 可能只是停止渲染

文件：`src/hooks/common/useAIChatStream.ts`、`app/api/chat-detail/route.ts`

- 前端 `stopStream` 调的是 `useChat.stop()`
- 后端 `streamText` 没有显式透传 `req.signal`（当前实现未看到 `abortSignal: req.signal`）

影响：

- 用户点停止：前端 UI 停了，但后端与上游模型可能仍在生成，导致 token 持续消耗。
- `isAbort` 的语义也会变得不可控（取决于 SDK 内部行为）。

建议：后端必须把 `req.signal` 透传给 `streamText`（AI SDK 支持 `abortSignal` 参数），并补 `maxDuration` 与初始化 try/catch（你清单中的 3.1/3.2/3.3）。

### 8) 服务端错误处理不完整：缺少参数校验与统一错误体

文件：`app/api/chat-detail/route.ts`

现状：

- 只校验 `chatId` 是否存在
- `messages` 未做 schema 校验（项目里其实已经有 `zod` schema：`src/models/ai-mission.ts`）
- 缺少 try/catch 包裹 `req.json()`、MongoDB、`streamText` 初始化阶段

影响：

- 非法请求会在 runtime 抛错，且在流式响应下难以给前端一个一致的错误提示。
- `useChat` 无法拿 HTTP status，前端很难区分 401/429/400。

建议：

- 增加 zod 校验：`chatId` 非空字符串、`messages` 必须是 UIMessage 数组（或你自定义的消息结构）。
- 统一错误响应协议：即使是流式，也要能在 stream 内发送“可读错误事件”，或者在初始化阶段直接 `return NextResponse.json(..., {status})`。

### 9) 模型切换能力目前是“UI 已有，链路未接上”

文件：`src/components/layout/AIWritingHome/components/ChatInput/index.tsx`、`app/api/chat-detail/route.ts`

现状：

- 下拉菜单写死 `deepseek v3.2`
- 前端请求 body 仅有 `{ chatId }`（transport body）
- 后端固定 `deepseek('deepseek-chat')`

影响：

- 任何“多模型”的需求都需要穿透：UI -> hook -> API -> provider 初始化。
- 目前“看起来支持切换”，实际并不支持，容易误导用户与后续开发者。

建议：把 `modelId` 作为 request 的显式字段，且服务端有 allowlist 与默认值；并在存储中记录每个 chat 的模型信息（至少记录最后一次使用的模型）。

### 10) 安全与渲染风险（需要明确边界）

文件：`src/components/layout/AIChat/index.tsx`

现状：

- assistant 内容使用 `MDEditor.Markdown` 渲染；是否默认消毒取决于库实现与配置
- 图片直接 `<img src>`，无任何域名白名单与 referrer 策略

建议：

- 明确 markdown 渲染的 XSS 策略（例如统一走 `rehype-sanitize` 或仅允许白名单标签）。
- 图片 URL 建议做域名 allowlist 或通过后端代理（至少避免 `javascript:`/`data:` 等恶意协议）。

## 与已有文档的关系（重要）

项目内已经存在迁移文档：`docs/ai-chat-sdk-migration-plan.md`，并且里面已经包含了 OpenSpec 与 Grill-me 的章节结构。

但它当前存在两个问题：

1. 路径是作者本机绝对路径（例如 `/Users/...`），不利于团队协作与后续实现对齐。
2. 文档主张“完全替换 AI SDK + useChat”，而你这次的诉求是“先把当前方案补齐并明确不合理点，再决定是否执行迁移”。

因此，本文件在保留“迁移视角”的同时，先给出一个**围绕现有方案的加固 Change**（OpenSpec），用于最小代价把当前方案变得可控、可维护、可扩展。

## OpenSpec 补充：现有方案加固 Change（建议先做）

> 目标：不改变大架构（仍用 `useChat + streamText`），但让它满足“多会话不串扰、状态机单一数据源、停止可真实中断、错误可分级、可观测”。

### Change ID

`ai-chat-sdk-hardening-v1`

### 背景

当前 AI 对话链路已实现基本可用（流式、停止、重试、会话落库），但在多会话隔离、状态竞争、错误分级、真实 abort、可观测等方面存在明显缺口，且部分逻辑疑似存在反向 bug（`checkDuplicate`）。

### 目标

- 发送链路正确：新消息能发送，重复消息能被拦截（或可配置）
- 多会话隔离：同一页面多个 chat 实例互不影响（事件、状态、loading）
- 状态机稳定：同一份状态只由一个地方写入，不发生覆盖竞争
- 停止是真停止：用户 stop 能终止后端与上游模型请求，减少 token 浪费
- 错误可读可分级：至少区分 abort、断网、鉴权失败、限流、参数错误、未知错误
- 清理彻底：组件卸载不留 timer、不中断的请求、不会 reset 其他会话状态

### 非目标

- 不迁移为自研 SSE/`fetch-event-source`（迁移另开 change）
- 不做 UI 大改（只做必要的禁用、提示、banner）
- 不改历史数据结构（必要时只做向后兼容字段）

### 方案概述（10 句内）

1. 修正 `checkDuplicate` 调用条件，保证“非重复才 send”。
2. `mitt` 事件全部携带 `chatId`，订阅端按 `chatId` 过滤。
3. `chat` redux state 改为 `byId[chatId]`，卸载时只清理当前会话。
4. `useAIChatStream` 删除 `useEffect([status])` 内的 dispatch，让状态写入集中在：`trackedSendMessage / onError / onFinish / stopStream / retryStream / retryTimer`。
5. 自动重试仅对 `isDisconnect` 生效，且 retry timer 需要 `isMounted` 守卫防止卸载后回调写状态。
6. `onPersisted` 包 try/catch，不影响状态机收尾。
7. 后端 `streamText` 传 `abortSignal: req.signal`，并补 `export const maxDuration = 30`（或按部署环境调整）。
8. 后端加 zod 校验与 try/catch：在初始化失败时返回 JSON 错误（含 status 与可读 message），在流式过程中失败则写入可解析的错误信息（至少能让前端拿到 message）。
9. 前端根据 `error.message`（或后端约定字段）做保守分类提示（abort/断网/鉴权/限流/其他）。
10. 观测埋点补齐：每次请求统一生成 `requestId`，前后端日志都带 `chatId/requestId/modelId`。

### 详细设计

#### 前端

- **状态唯一数据源**：把 `requestStatus` 的写入集中在 hook 内单点；UI 组件只读。
- **重复提交防护**：当 `requestStatus in ['submitted','streaming','retrying']` 时禁用 send；点击 send 等价于 stop（与你现有交互一致，但需要明确状态机边界）。
- **卸载清理**：
  - 清理 retry timer
  - 调用 `stopStream()`
  - 清理当前 chatId 的 redux state（而不是全局 reset）
- **事件总线改造**：payload 加 `chatId`，并把 `PostingBox` 的 streaming 事件也做同样改造。

#### 后端

- **abort 透传**：`streamText({ abortSignal: req.signal, ... })`
- **超时配置**：`export const maxDuration = 30;`（以你的部署环境为准）
- **参数校验**：使用 zod 校验 `chatId/messages`，非法请求直接返回 `400`
- **错误透传**：
  - 401/429/400/500 在初始化阶段用 HTTP status 返回 JSON（让前端至少能拿到 message）
  - 流式中的错误：返回可读 message（不要泄漏 stack）

#### 数据

- 增加 `model_id`（可选）：记录本会话最后一次选择的模型，用于回放/审计/复现。

#### 观测

- 前端：已有 `trackPerformance`，建议补充字段：`chat_id`、`request_id`、`model_id`、`retry_reason`（disconnect/error）
- 后端：`console.error` 统一结构化输出（或接入 Sentry tag），同样带上上述字段

### 验收标准（可测试）

1. 新开会话输入一次消息：能正常发送并流式输出。
2. 在 5 分钟内重复触发同一条消息：不会重复发送（或按配置允许）。
3. 打开两个不同 `chatId` 的对话页：在 A 发送不影响 B；A stop 不会 stop B。
4. 流式生成中点击 stop：前端停止渲染且后端请求被终止（后端日志可观察到 abort）。
5. 模拟断网（或中断连接）：只触发有限次自动重试，达到上限后进入 error + 手动重试。
6. 401/429：前端展示可读提示且不会自动重试。
7. 页面卸载：不再出现 timer 回调写 redux 的警告；不会把其他会话状态 reset。

### 风险与回滚

- 风险：redux 结构改造会影响很多组件引用 `state.chat` 的方式。
- 回滚：保留旧 slice 一段时间，提供兼容 selector（`selectChatState(chatId)`），逐步迁移组件。

## Grill-me：在进入“执行阶段”前必须回答的问题

> 下面的问题是为了在你确认执行前，把“实现一定会踩坑的点”提前问穿。你可以直接在文档里逐条补答案，或者告诉我你的选择，我再把答案补齐进 OpenSpec。

1. 多会话的产品形态是否真实存在？
   - 例如：允许用户同时开多个 tab、或者一个页面里并排两个 chat 组件？
2. `checkDuplicate` 的真实意图是什么？
   - 是“5 分钟内同样输入禁止重复发送”，还是“防止 UI 误触导致的重复点击”？
3. abort 的产品语义是什么？
   - stop 后是否要保留半截 assistant 文本作为“草稿/中断记录”，还是直接丢弃？
4. 自动重试的业务边界是什么？
   - 仅断网？是否包含 5xx？429 是否需要退避重试（exponential backoff）？
5. 错误提示的来源以谁为准？
   - 前端保守分类足够，还是后端必须透传可机器判读的 `error_code`？
6. 模型切换的粒度是什么？
   - 按会话固定？按消息可切？切模型是否需要清空上下文？
7. 你是否需要对话链路鉴权？
   - 当前 `proxy()` 直接放行所有请求；AI 对话接口是否应加入登录态校验与频控？
8. 性能目标是什么？
   - 首 token 与总耗时的预算阈值是多少？失败率的可接受范围是多少？

## 本次安装的 openspec / grill-me（官方版本）

按你的要求从官方源下载安装（2026-08-27）：

- OpenSpec（Fission-AI 官方）
  - CLI：全局安装 `@fission-ai/openspec@1.11.0`（`openspec --version` 已验证）
  - 官方 skills：`openspec init --tools codex` 生成于 `.agents/skills/`，共 6 个：`openspec-propose` / `openspec-explore` / `openspec-apply-change` / `openspec-update-change` / `openspec-sync-specs` / `openspec-archive-change`
  - 项目配置：`openspec/config.yaml`
  - Codex 调用方式：`$openspec-propose` 等（Codex 仅支持 skills，不支持 `/opsx:*`）
- grill-me（Matt Pocock 官方版）
  - `.codex/skills/grill-me/SKILL.md`（入口）
  - `.codex/skills/grilling/SKILL.md`（核心追问流程，grill-me 依赖）
- 记录：`skills-lock.json` 已更新全部来源与版本。

## Grill-me 决策记录（三轮确认 · 2026-08-27）

> 通过 grilling 流程逐轮确认，答案全部采用推荐项。此记录作为执行阶段的输入，不再重复询问。

### 第一轮：方向与目标

| # | 决策点 | 结论 |
|---|--------|------|
| Q1 | 方案方向 | **C 两阶段**：本次先加固现有 AI SDK 方案并落地；自封装 SSE 迁移（fetch-event-source）作为后续迭代，不推翻现有实现 |
| Q2 | 首要目标 | **C 为主、A 优先**：既修真实缺陷，又能作为面试深挖项目；行为正确优先于话术包装 |
| Q3 | 多模型切换 | **B 只做后端抽象**：`createOpenAI` 统一封装 OpenAI 兼容接口（含 DeepSeek），模型/密钥走环境变量；UI 暂不提供切换 |
| Q4 | 性能埋点 | **A 轻量保留**：保留 `trackPerformance` 指标，抽成薄封装，不删能力 |

### 第二轮：架构与协议

| # | 决策点 | 结论 |
|---|--------|------|
| Q5 | 会话状态落点 | **A Redux byId**：`chat` slice 重构为 `byId: Record<chatId, ChatState>` + `currentChatId`；卸载只删自身 key，不全局 reset |
| Q6 | 中间态驱动 | **A 收敛 status effect**：保留 status → 会话级中间态写入（单一动作 + chatId）；`onFinish/onError/stop/retry` 只写终结态；同 key 幂等覆盖，消除竞争 |
| Q7 | mitt 去留 | **A 短期过滤**：事件携带 `chatId`，接收端过滤；Context 重构留到迁移阶段 |
| Q8 | 跳转传参 | **A URL searchParams**：`/ai-chat-home` 跳转时把输入放 `?q=`（encodeURIComponent），目标页读取消费；不再依赖 redux temp 跨页传参 |
| Q9 | 错误分类协议 | **A 双通道**：请求前/校验阶段错误直接返回 JSON `{code,message}`；流开始后的错误透传 `statusCode`（AI SDK 错误对象自带），后端同时给出用户可读 message，不泄漏栈信息 |

### 第三轮：执行层参数

| # | 决策点 | 结论 |
|---|--------|------|
| Q10 | 分支规范 | **A `feat/ai-chat-hardening`**：基于 main，仅包含本次 AI 对话加固改动（用户明确要求新建功能分支） |
| Q11 | abort 落库 | **A 不落半截**：请求开始前先存用户消息；abort 时不把半截 assistant 内容当最终回答落库（与旧迁移计划边界 8.4 一致） |
| Q12 | 重试参数 | **A**：仅 `isDisconnect` 自动重试，上限 2 次，间隔 1200ms；`isError` 不自动重试（手动重试按钮）；`isAbort` 不计入重试 |
| Q13 | 参数校验 | **A zod**：复用 `models/ai-mission.ts` 的 schema 判定，校验失败返回 400 |
| Q14 | Provider 配置 | **A 环境变量**：`AI_PROVIDER_BASE_URL`（默认 DeepSeek 地址）+ `DEEPSEEK_API_KEY`（沿用）+ `AI_CHAT_MODEL`（默认 deepseek-chat）；后端维护模型白名单，API key 不下发前端 |
| Q15 | 埋点封装 | **A requestContext**：收敛 requestId/chatId/retryCount/startedAt 的读写，埋点调用集中化，指标名不变 |

### 执行约束

- **本次所有改动在 `feat/ai-chat-hardening` 分支进行**，基于当前 main；文档随分支一起提交。
- 实施顺序建议：后端 route（校验/abort/错误/封装）→ Redux byId → useAIChatStream 重构 → useHaChat / mitt / 跳转传参 → AIChat 页与 ChatInput 适配 → lint/build/手动验证。
- 验收标准沿用上文 OpenSpec Change 的验收清单（第 289 行起）。

### 仍开放 / 明确列为非目标的事项（不 silently assume）

以下点本轮未展开，执行时按默认处理，如有异议在确认执行时一并提出：

- `useOneRequest.checkDuplicate` 的调用疑似写反（扫描结论 #1）：**本次一并修正**（改为对“重复请求”返回拒绝），否则发送主链路行为不可预期。
- 对话链路鉴权 / 频控（`proxy()` 当前全放行）：**列为非目标**，不做；如需登录态校验留待后续。
- 多会话真实形态（多 tab / 并排组件）：按“同一 chatId 只存在一个活跃实例”设计，byId 隔离已覆盖跨会话污染。
- abort 半截内容的产品化展示（`status: aborted` 消息）：**列为非目标**，留待迁移阶段。

