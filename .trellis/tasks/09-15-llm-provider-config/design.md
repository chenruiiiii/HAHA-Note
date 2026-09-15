# LLM 多模型接入 Design（最终整合版）

## Design Summary

把散落在两个 route 里的 provider 构造收敛为单一「AI Provider 工厂」模块，用环境变量描述「用哪家供应商、哪个模型、白名单是什么」，业务代码只面向工厂要模型。前端模型下拉从写死文案改为真实列表驱动。

```text
env (供应商/模型/白名单/URL) -> AI provider 工厂 -> chat-detail / docs-summary 共用
                                  ^
前端下拉(GET /api/ai-models) --model--> 请求体 -> 服务端白名单校验 -> 落库 provider/model
```

## 与既有文档的关系

### 沿用（不重复实现）

- design-audit Q11/Q12：abort 不落半截、仅 disconnect 自动重试 2 次 —— 已由硬化提交合入 master，本方案只保证不回归。
- design-audit Q9：错误双通道（初始化阶段 JSON / 流阶段 statusCode）—— 已在 master，不改。
- design-audit Q14：API key 不下发前端、后端维护白名单 —— 本方案沿用并扩展（新增 allowlist 环境变量）。
- migration-plan 8.4/8.5：落库边界（assistant 只在 finish 落库、abort 不落半截）、重试边界（≤2 次、每次重建 AbortController）—— 已在 master 生效。

### 演进（本方案相对既有决策的变化）

- design-audit Q3 原结论「UI 暂不提供切换」→ **本方案接通前端真实模型列表**（grill-me 已确认），对齐 audit 第 9 条建议。
- design-audit Q14 默认 baseURL 写 DeepSeek 地址 → **改为 `AI_PROVIDER_BASE_URL` 必配（自有网关）**（grill-me 已确认），apiKey 主键从 `DEEPSEEK_API_KEY` 调整为 `AI_PROVIDER_API_KEY`（旧变量回退）。
- migration-plan 3.4 的「原生 fetch 替换 AI SDK」→ **非本轮目标**，但保留其配置契约（含 `AI_SUMMARY_MODEL`），未来迁移无需改 env。

### 明确非目标

- 对话链路鉴权/频控、markdown 渲染消毒、图片 URL 域名白名单（design-audit 已标注）。
- 原生 fetch provider client / SSE 自定义协议（migration-plan 远期方向）。
- 模型用量计费/统计、历史会话模型字段迁移。

## Key Decisions

- **统一抽象**：新增 `src/lib/ai/provider.ts`（服务端模块），集中维护常量、环境变量读取、provider 缓存、白名单校验。
- **默认切换**：`DEFAULT_CHAT_MODEL = 'deepseek-v4-flash'`，`ALLOWED_MODELS` 默认 `['deepseek-v4-flash']`，可被 `AI_CHAT_ALLOWED_MODELS`（逗号分隔）覆盖。
- **OpenAI 兼容网关**：沿用 `@ai-sdk/openai` 的 `createOpenAI` 作为唯一供应商适配器。deepseek-v4-flash 走自有/第三方 OpenAI 兼容网关（baseURL 由 `AI_PROVIDER_BASE_URL` 配置，代码不写死厂商地址）；未来接 OpenAI、Kimi、Moonshot 等都走这条路（换 baseURL + key + 白名单即可），Anthropic/Gemini 再按需加适配分支。
- **apiKey 分层**：主变量 `AI_PROVIDER_API_KEY`（网关 key）；`DEEPSEEK_API_KEY` 作为向后兼容回退。读取顺序 `AI_PROVIDER_API_KEY` → `DEEPSEEK_API_KEY`，两者皆缺时调用报可读错误。
- **摘要模型独立可配**：`AI_SUMMARY_MODEL` 存在时覆盖摘要调用模型，默认跟随主模型。
- **前端真实列表**：`GET /api/ai-models` 返回当前白名单（id + 展示名），ChatInput 下拉由该接口驱动，选择后请求体带 `model`；不引入额外 UI 状态管理复杂度（仍走 mitt 事件链）。
- **落库真实模型**：POST 请求体增加可选 `model`，路由按 `resolveModel(model)` 后把最终值传入持久化（Prisma 分支写 `conversation.model` 与 `message.model/#provider`）。**单后端**：MongoDB 分支不做任何适配（`DATA_BACKEND=prisma` 时不执行，代码保留现状）。
- **校验前置**：白名单校验必须在发起 LLM 调用前，非法模型直接返回 400 JSON。
- **旧数据不动**：历史会话 model 字段缺失/为旧值，不迁移、不回填；读取侧按字符串展示即可。

## Boundary Rules

### Provider 工厂接口

```ts
// src/lib/ai/provider.ts
export function getChatModel(model?: string): Model // 主对话
export function getSummaryModel(model?: string): Model // 摘要/标题
export function listAllowedModels(): Array<{ id: string; name: string }> // 前端下拉
export function resolveModelName(model?: string): string // 校验 + 返回最终模型名
```

- `resolveModelName`：`name || env.AI_CHAT_MODEL || DEFAULT_CHAT_MODEL`，再查白名单，不在白名单直接 throw。
- provider 实例按 baseURL+apiKey 缓存，避免每次请求重建。
- 工厂只读环境变量，不依赖请求上下文；配置缺失时在调用时抛可读错误。

### 环境变量契约

| 变量 | 含义 | 默认 |
| --- | --- | --- |
| `AI_CHAT_MODEL` | 主对话默认模型 | `deepseek-v4-flash` |
| `AI_CHAT_ALLOWED_MODELS` | 白名单（逗号分隔） | `deepseek-v4-flash` |
| `AI_SUMMARY_MODEL` | 摘要/标题模型覆盖 | 跟随主模型 |
| `AI_PROVIDER_BASE_URL` | 自有 OpenAI 兼容网关地址（**必配**，无厂商默认值） | 无 |
| `AI_PROVIDER_API_KEY` | 网关 apiKey（首选） | 必填 |
| `DEEPSEEK_API_KEY` | 旧变量，向后兼容回退 | 仅回退用 |

### 请求体与安全

- `ChatRequestBodySchema` 增加 `model: z.string().optional()`。
- 非法模型：`resolveModelName` 抛错 → 路由 catch → 400（不暴露堆栈）。
- 前端下拉数据源 `GET /api/ai-models` 只返回白名单 id/name，绝不暴露 apiKey/baseURL。

### 落库

- Prisma：`upsertConversationMessages` 入参已支持 `model`；路由把 `model` 与 `provider` 传给 DAL 并落库 message。
- **单后端约束**：`DATA_BACKEND=prisma`（Vercel 已配 `DATABASE_URL`）；MongoDB 分支不新增 provider/model 写入，保持现状作为回滚路径但本方案不维护。

## Rollback

- 改动集中在新增模块 + 两个 route 的 provider 构造处 + 前端下拉，schema 不动。
- 回滚：把 `DEFAULT_CHAT_MODEL`/白名单改回旧值、前端下拉回退写死列表即可，无需迁移数据。
- 配置缺失（baseURL/apiKey 未配）走可读错误，不会静默失败到旧网关。