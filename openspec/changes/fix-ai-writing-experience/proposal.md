## Why

AI 写作链路目前存在历史消息角色错位、回复结束状态滞留、附件无法添加、新会话标题未生成，以及模型列表重复请求等问题，直接影响历史会话可读性和日常写作效率。

## What Changes

- 修复历史会话消息角色映射：兼容 Prisma 大写枚举与旧 MongoDB 小写值，确保 assistant/system 消息不再显示为用户消息。
- 优化 AI 回复展示：复制按钮仅保留图标和 Tooltip；收到流式终态后立即退出“回复中”样式；AI 正文与复制图标左对齐。
- 新增聊天附件能力：输入框加号支持选择 `.txt`、`.md`、`.docx`、`.doc`、`.pdf`，由后端解析为文本后随消息发送；限制文件大小与提取文本长度，并提供解析状态和失败提示。
- 修复新会话标题生成触发条件，覆盖 `新对话`、`新建对话`、`新建文档` 等默认标题，并在回答持久化后刷新标题。
- 为可用模型列表增加前端缓存与并发去重，避免每次输入组件挂载都请求 `/api/ai-models`；不缓存聊天流接口 `/api/chat-detail`。
- 保持现有聊天流协议、消息持久化结构和数据库模型不变。

## Capabilities

### New Capabilities

- `ai-writing/chat-experience`: 历史消息角色、流式终态、消息操作展示、附件解析、标题生成与模型列表缓存等 AI 写作交互行为。

### Modified Capabilities

无。

## Impact

- 前端：`src/server/dal/conversations.ts` 的角色映射、`src/components/layout/AIChat/*` 的消息渲染与流状态、`AIWritingHome/components/ChatInput/*` 的附件与模型选择、新增模型缓存 hook。
- 后端：新增 `app/api/chat-attachments/route.ts` 文件解析接口；调整 `app/api/chat-detail/route.ts` 的默认标题判断；为 `/api/ai-models` 增加 HTTP 缓存头。
- 依赖：新增服务端文档解析依赖（DOCX/DOC/PDF）；解析在服务端完成，客户端 bundle 不引入解析库。
- 数据：不新增数据库字段；附件提取文本作为消息文本上下文持久化。
- 非目标：不做附件对象存储、图片/音频解析、OCR、离线解析或聊天流接口缓存。
