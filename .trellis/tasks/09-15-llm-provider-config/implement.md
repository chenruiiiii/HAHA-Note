# LLM 多模型接入 Implementation Plan（最终整合版）

> 前置确认：`feat/ai-chat-hardening` 的硬化代码已在 master，本计划**不重复实现**硬化内容，只保证不回归。

## 1. 新增统一 Provider 工厂

- 新建 `src/lib/ai/provider.ts`（服务端模块，命名对齐 migration-plan 5.2 的 provider client 意图）。
- 收敛常量：`DEFAULT_CHAT_MODEL`（`deepseek-v4-flash`）、`DEFAULT_ALLOWED_MODELS`（`['deepseek-v4-flash']`）。**baseURL 不做默认值**，必须由 `AI_PROVIDER_BASE_URL` 提供（自有网关），缺失时调用报配置错误。
- 导出接口（见 design.md）：
  - `getChatModel(model?)` → AI SDK Model（主对话）
  - `getSummaryModel(model?)` → AI SDK Model（摘要/标题）
  - `resolveModelName(model?)` → 白名单校验后的模型名
  - `listAllowedModels()` → 前端下拉数据源 `{ id, name }[]`
- 实例缓存：按（baseURL + apiKey）缓存 `createOpenAI` provider，避免每请求重建。
- apiKey 读取：`AI_PROVIDER_API_KEY` → `DEEPSEEK_API_KEY`（向后兼容回退），都缺失时调用报可读错误。

## 2. chat-detail 主对话路由

- 移除本地 `DEFAULT_BASE_URL/DEFAULT_CHAT_MODEL/ALLOWED_MODELS/getProvider/resolveModel`（route.ts:18-66），改用工厂。
- `ChatRequestBodySchema` 增加 `model: z.string().optional()`。
- 流式链路 `getProvider()(resolveModel())` 替换为 `getChatModel(body.model)`。
- 标题/摘要生成走 `getSummaryModel()`（默认跟随主模型 `deepseek-v4-flash`，`AI_SUMMARY_MODEL` 可覆盖）。
- 落库：`saveChatDetailPrisma` 传入最终 `model` 与 `provider`；`upsertConversationMessages` 已有 `model` 入参，补齐 `provider`。MongoDB 分支（`saveChatDetail`）不动。
- 非法模型：`resolveModelName` throw → 路由 catch → 400 JSON。
- 硬化行为（abort 透传、onFinish 不落半截、错误双通道）保持不变。

## 3. docs-summary 文档摘要路由

- 移除 `createDeepSeek`（route.ts:1,43），改用 `getSummaryModel()`。
- 摘要模型优先级：`AI_SUMMARY_MODEL` → 主模型默认 `deepseek-v4-flash`。

## 4. 前端模型选择

- 新增 `GET /api/ai-models`：返回 `listAllowedModels()`（只含 id/name，不含密钥/baseURL）。
- `ChatInput/index.tsx`：下拉数据改为请求该接口；文案去掉写死的 `deepseek v3.2`。
- `useAIChatStream.ts`：transport `body` 增加当前所选 `model`；`sendMessage`/`regenerate` 时带上。
- 切换模型不重置会话消息，仅影响下一次请求。

## 5. 存储层（单后端）

- Prisma：`conversation.model` 写实际模型、`provider` 写实际供应商；`message.provider/model` 一并写入。
- **单后端约束**：只改 Prisma 分支与 `conversations.ts` DAL；MongoDB 分支（`saveChatDetail` 等）保持现状，不新增 provider/model 字段。

## 6. 环境变量与文档

- `.env.example`：默认模型说明改为 `deepseek-v4-flash`；`AI_PROVIDER_BASE_URL` 标明必配（自有网关）；新增 `AI_CHAT_ALLOWED_MODELS`、`AI_SUMMARY_MODEL`、`AI_PROVIDER_API_KEY` 说明，保留 `DEEPSEEK_API_KEY` 兼容说明。
- Vercel：告知在控制台新增 `AI_PROVIDER_BASE_URL` / `AI_PROVIDER_API_KEY`（或复用 `DEEPSEEK_API_KEY`）。
- README / docs：同步默认模型与配置说明；在 `docs/ai-chat-design-audit.md` 或新文档中记录「Q3/Q14 已演进」的决策（UI 接通真实列表、baseURL 必配自有网关、apiKey 主键变更），避免后续文档误导。

## 7. 验证

- `npm run lint`、`npm run build`。
- 手动：正常对话（默认新模型走自有网关）、切换模型后对话、非法模型返回 400、docs-summary 生成、新旧会话落库字段。
- 配置缺失验证：不配 `AI_PROVIDER_BASE_URL` 时返回可读配置错误；apiKey 缺失同理。
- 硬化回归：abort 不落半截、断网自动重试 ≤2 次、双会话互不干扰。

## 风险与回滚

- 默认模型切换影响所有会话行为：回滚只需改环境变量/默认常量，无数据迁移。
- 前端下拉接口失败时回退显示默认模型，不阻断输入。
- `AI_PROVIDER_BASE_URL` 必配会让未配置网关的环境（如本地无 .env）报配置错误：属预期行为，README 标注需先配置。