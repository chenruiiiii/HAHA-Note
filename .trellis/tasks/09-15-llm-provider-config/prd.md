# LLM 多模型接入 PRD（最终整合版）

## Goal

把 HAHA-Note 的 AI 对话默认模型从 `deepseek-chat` 切换为 `deepseek-v4-flash`，同时把模型/供应商的接入方式配置化，让后续接入其他公司模型不用改业务代码、只改配置。

## Background（现状，2026-09-15 核实）

### 硬化成果已合入 master

`feat/ai-chat-hardening` 分支的核心代码改动**已通过 PR #1（cdac939）合入 master**，包括：
- `ab1e7b1` 加固 AI 对话链路（多会话隔离 / abort 透传 / 重试收紧 / 错误双通道）
- `f6a93a1`（ai chat hardening v1）、`021c057`（build blocker 修复）

验证：master 上 `app/api/chat-detail/route.ts` 含 `abortSignal`/`toUIMessageStreamResponse`/`req.signal` 等硬化特征；`src/hooks/common/useAIChatStream.ts` 含 `isDisconnect`/`MAX_AUTO_RETRY`/`setChatRequestStateAction`。分支上未合入的只有 2 个 `.gitignore` 提交，与 LLM 对话无关。**本方案建立在这些硬化成果之上，不重复实现。**

### 代码现状

- 主对话链路 `app/api/chat-detail/route.ts`：AI SDK v6 `streamText` + `createOpenAI` 统一封装 OpenAI 兼容接口，默认模型 `deepseek-chat`，白名单 `['deepseek-chat', 'deepseek-reasoner']`，baseURL 默认 `https://api.deepseek.com/v1`（route.ts:18-66）。
- 文档摘要 `app/api/docs-summary/[docsId]/route.ts`：走 `@ai-sdk/deepseek`（`createDeepSeek` + `deepseek('deepseek-chat')`），模型/baseURL 完全写死（route.ts:1,43）。
- 前端模型下拉 `ChatInput/index.tsx`：写死「deepseek v3.2」，点击无联动，请求体从未携带 model。
### 存储现状（单后端）

- 代码为**双后端并存**（`isPrismaBackend()` 分支配对），但生产与开发一律 `DATA_BACKEND=prisma`（**单后端**，PostgreSQL/Neon）。
- Vercel 已配置 `DATABASE_URL` / `MIGRATION_DATABASE_URL` / `DATA_BACKEND=prisma` 等环境变量，LLM 会话/消息落库走 Prisma → PostgreSQL。
- Prisma `Conversation.provider/model`、`Message.provider/model` 字段已存在，但 `upsertConversationMessages` 落库 model 永远写死 `'deepseek-chat'`（conversations.ts:147）。
- **本方案不涉及 MongoDB**：MongoDB 分支代码保留现状、不新增字段、不做任何适配（`DATA_BACKEND=prisma` 时不会执行）。

### 既有文档约束

- `docs/ai-chat-design-audit.md`：Q3 多模型切换 = 后端抽象（`createOpenAI` 统一封装 OpenAI 兼容接口），模型/密钥走环境变量；Q14 Provider 配置 = `AI_PROVIDER_BASE_URL` + `DEEPSEEK_API_KEY` + `AI_CHAT_MODEL`，后端维护模型白名单，API key 不下发前端；第 9 条建议 `modelId` 作为 request 显式字段 + 服务端 allowlist + 存储记录模型。
- `docs/ai-chat-sdk-migration-plan.md`：远期目标是自封装 provider client 用原生 fetch 替换 AI SDK，预留配置 `DEEPSEEK_API_KEY` / `AI_PROVIDER_BASE_URL` / `AI_CHAT_MODEL` / `AI_SUMMARY_MODEL`（3.4 节）。**该替换非本轮目标**，但配置契约沿用。

## Requirements

- 主对话默认模型切换为 `deepseek-v4-flash`，白名单默认仅含新模型（可配）。
- 接入自有/第三方 OpenAI 兼容网关：`AI_PROVIDER_BASE_URL` 必配（代码不写死厂商地址），`AI_PROVIDER_API_KEY` 为网关 key（`DEEPSEEK_API_KEY` 仅向后兼容回退）。
- 模型接入必须配置化：供应商 baseURL、apiKey、默认模型、白名单都能通过环境变量调整，切换模型/供应商不需要改业务代码。
- 采用 OpenAI 兼容网关抽象（`createOpenAI` 统一封装）；未来接 OpenAI/Kimi/Moonshot 等兼容厂商只换配置即可，Anthropic/Gemini 等非兼容供应商预留扩展点。
- 文档摘要接口与主对话统一到同一套 provider 抽象，支持独立配置摘要模型（默认跟随主模型，`AI_SUMMARY_MODEL` 可覆盖）。
- 前端模型下拉显示真实可用模型列表（由 `GET /api/ai-models` 驱动），切换后请求体携带 `model`；模型必须经服务端白名单校验。
- 会话与消息经 **Prisma/PostgreSQL 单后端**持久化，写入实际使用的 `provider`/`model`，旧数据不迁移也不回填。
- API key 只存在于服务端，绝不下发前端（沿用既有约束）。
- 对话链路鉴权/频控、XSS 渲染消毒、图片 URL 域名白名单**列为非目标**（design-audit 已标注，留待后续）。

## Acceptance Criteria

- [ ] 服务端默认模型为 `deepseek-v4-flash`，白名单默认只允许该模型；通过环境变量可修改默认模型与白名单。
- [ ] 前端下拉展示真实模型列表，选择模型后请求体携带 `model`；未选择时服务端回退默认模型。
- [ ] 前端传入白名单外模型时，服务端返回可读错误且不发起 LLM 调用。
- [ ] `docs-summary` 与 `chat-detail` 使用同一 provider 抽象；摘要模型默认跟随主模型，可通过 `AI_SUMMARY_MODEL` 独立覆盖。
- [ ] 新建会话/消息经 Prisma 落库 `provider`/`model` 为实际使用值；旧会话不受影响。
- [ ] 未配置 `AI_PROVIDER_BASE_URL` / apiKey 时返回可读配置错误。
- [ ] 既有硬化行为不回归：abort 不落半截、断网仅自动重试 2 次、多会话互不干扰。
- [ ] `npm run lint`、`npm run build` 通过；手动验证：正常对话、切换模型、非法模型、docs-summary 生成。
