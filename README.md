# Haha Note

Haha Note 是一个基于 Next.js App Router 的知识笔记与 AI 写作应用。项目集成了文档管理、知识库浏览、收藏、公开笔记、AI 对话生成、对话记录沉淀和推荐内容浏览等能力，数据主要存储在 MongoDB 中。

## 功能概览

- 文档工作台：展示最近编辑、最近浏览的文档，并支持新建文档/知识库入口。
- 知识库管理：按知识库组织文档，支持知识库列表、详情页、文件侧栏和文档详情查看。
- AI 写作/对话：基于 AI SDK 和 DeepSeek 模型实现流式对话、自动重试、停止生成、会话标题与摘要生成。
- 收藏与推荐：支持收藏内容、漫游推荐列表、推荐详情与公开笔记浏览。
- 公开笔记：通过公开链接查看文档内容。
- 登录鉴权：内置管理员登录接口，使用 HttpOnly Cookie 保存 access token 和 refresh token。
- 监控接入：生产环境通过 `@sentry/nextjs` 接入 Sentry。

## 技术栈

- 框架：Next.js 16、React 19、TypeScript
- UI：Ant Design 6、Sass、Tailwind CSS
- 状态管理：Redux Toolkit、RTK Query
- 编辑器：TipTap、`@uiw/react-md-editor`、Vditor
- AI：AI SDK、`@ai-sdk/deepseek`
- 数据库：MongoDB
- 校验：Zod
- 监控：Sentry

## 项目结构

```text
.
├── app/                         # Next.js App Router 页面、布局和 API routes
│   ├── (home)/                  # 主应用页面组
│   ├── api/                     # 服务端接口
│   ├── login/                   # 登录页
│   ├── public-note/[id]/        # 公开笔记页
│   └── repo-detail/             # 知识库详情页
├── public/                      # 静态资源
├── src/
│   ├── assets/                  # 样式、图片、iconfont
│   ├── components/              # 通用组件和业务布局组件
│   ├── constants/               # 常量配置
│   ├── hooks/                   # 通用 hooks 和业务 hooks
│   ├── lib/                     # MongoDB、HTTP、事件总线、鉴权 token 等基础能力
│   ├── middleware/              # 鉴权路径配置
│   ├── models/                  # Zod schema 和类型定义
│   ├── scripts/                 # MongoDB 种子数据脚本
│   ├── services/                # 客户端请求封装
│   ├── store/                   # Redux store 与 slices
│   ├── types/                   # 公共类型
│   └── utils/                   # 工具函数
├── proxy.ts                     # Next.js proxy，中间件鉴权逻辑入口
├── next.config.ts               # Next.js 与 Sentry 配置
└── package.json
```

## 环境要求

- Node.js：建议使用 20.x 或更高版本
- npm：项目当前使用 `package-lock.json`
- MongoDB：本地或云端 MongoDB 实例
- DeepSeek API Key：使用 AI 对话与摘要能力时需要

## 环境变量

本地开发建议创建 `.env.development` 或 `.env.local`。不要提交真实密钥。

```env
# MongoDB 连接地址
APP_MONGODB_MONGODB_URI=mongodb+srv://user:password@cluster.example.mongodb.net

# DeepSeek API Key
DEEPSEEK_API_KEY=your_deepseek_api_key

# JWT 签名密钥。生产环境必须设置为足够随机的长字符串
AUTH_TOKEN_SECRET=replace-with-a-strong-secret

# 浏览器侧 API 地址
NEXT_PUBLIC_APP_API_URL=http://localhost:3000/api

# 浏览器侧站点地址，用于公开笔记跳转
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

说明：

- `APP_MONGODB_MONGODB_URI` 是必填项，缺失时 MongoDB 单例会直接抛错。
- `DEEPSEEK_API_KEY` 影响 `/api/chat-detail` 和 `/api/docs-summary/[docsId]` 等 AI 接口。
- `AUTH_TOKEN_SECRET` 有开发兜底值，但生产环境必须显式配置。

## 本地启动

安装依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

浏览器打开：

```text
http://localhost:3000
```

构建生产包：

```bash
npm run build
```

启动生产服务：

```bash
npm run start
```

## 数据初始化

项目提供了 MongoDB 种子脚本。脚本默认读取 `.env.development`：

```bash
npm run seed
```

该命令等价于填充知识库数据：

```bash
npx tsx --env-file=.env.development src/scripts/index.ts repos
```

初始化管理员账号：

```bash
npm run seed:admin
```

可用任务：

```bash
npx tsx --env-file=.env.development src/scripts/index.ts repos
npx tsx --env-file=.env.development src/scripts/index.ts docs
npx tsx --env-file=.env.development src/scripts/index.ts activity
npx tsx --env-file=.env.development src/scripts/index.ts favorite
npx tsx --env-file=.env.development src/scripts/index.ts ai-chat
npx tsx --env-file=.env.development src/scripts/index.ts admin
npx tsx --env-file=.env.development src/scripts/index.ts stroll
npx tsx --env-file=.env.development src/scripts/index.ts all
```

开发环境内置演示账号：

| 账号 | 密码 | 角色 |
| --- | --- | --- |
| `admin` | `admin` | 管理员 |
| `editor` | `editor123` | 内容编辑 |

这些账号只适合本地开发或演示，生产环境请改为真实用户体系或至少更换密码。

## 常用脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动 Next.js 开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run start` | 启动生产服务 |
| `npm run lint` | 运行 ESLint |
| `npm run seed` | 初始化知识库数据 |
| `npm run seed:admin` | 初始化管理员账号 |

## 主要页面

| 路径 | 说明 |
| --- | --- |
| `/` | 开始页，展示文档入口与最近记录 |
| `/repository` | 知识库列表 |
| `/repo-detail/[repoId]/home` | 知识库首页 |
| `/repo-detail/[repoId]/[fileId]` | 知识库文档详情 |
| `/ai-chat-home` | AI 写作首页 |
| `/ai-chat/[id]` | AI 对话详情 |
| `/collect` | 收藏页 |
| `/stroll` | 漫游推荐 |
| `/stroll-recommend/[id]` | 推荐详情 |
| `/public-note/[id]` | 公开笔记 |
| `/personal-center/[id]` | 个人中心 |
| `/login` | 登录页 |

## 主要接口

| 接口 | 说明 |
| --- | --- |
| `/api/login` | 登录并写入鉴权 Cookie |
| `/api/logout` | 退出登录并清理 Cookie |
| `/api/auth/refresh` | 刷新 access token |
| `/api/repository` | 获取知识库列表 |
| `/api/repo-detail/[id]` | 获取知识库详情 |
| `/api/docs-detail/[docsId]` | 获取文档详情 |
| `/api/docs-summary/[docsId]` | 生成文档摘要 |
| `/api/chat-detail` | AI 流式对话与会话持久化 |
| `/api/chat/[id]` | 获取 AI 会话详情 |
| `/api/chat-latest-mission` | 获取最近 AI 会话 |
| `/api/chat-collect-mission` | 获取收藏 AI 会话 |
| `/api/start/edited` | 获取最近编辑记录 |
| `/api/start/browsed` | 获取最近浏览记录 |
| `/api/public-note/[id]` | 获取公开笔记 |
| `/api/stroll/left` | 获取左侧推荐列表 |
| `/api/stroll/right` | 获取右侧推荐列表 |

## 鉴权说明

登录成功后，服务端会写入两个 HttpOnly Cookie：

- `ha_note_access_token`：短期 access token，默认 15 分钟。
- `ha_note_refresh_token`：长期 refresh token，默认 7 天。

`src/lib/http.ts` 会在接口返回 401 时尝试调用 `/api/auth/refresh` 自动刷新登录态。`proxy.ts` 中保留了完整的页面级鉴权逻辑，不过当前 `proxy()` 默认直接放行，方便开发调试；需要恢复页面鉴权时，可以将入口切换到 `authProxyWithLogin`。

## 数据库说明

项目会使用多个 MongoDB database/collection：

| Database | Collection | 用途 |
| --- | --- | --- |
| `ha_admin` | `users` | 管理员账号 |
| `repository` | `repo_list` | 知识库列表 |
| `repository` | `docs_detail` | 文档详情 |
| `user_activity` | `edit_history` | 编辑历史 |
| `user_activity` | `browse_history` | 浏览历史 |
| `user_activity` | `favorite_repos` | 收藏知识库 |
| `ai-chat` | `latest_mission` | 最近 AI 会话 |
| `ai-chat` | `collect_mission` | 收藏 AI 会话 |
| `ai-chat` | `ai_chat_detail` | AI 会话详情 |
| `stroll-recommend` | `recommend_details` | 漫游推荐详情 |

## 部署注意事项

- 在 Vercel 或其他平台部署时，需要配置 `APP_MONGODB_MONGODB_URI`、`DEEPSEEK_API_KEY`、`AUTH_TOKEN_SECRET`、`NEXT_PUBLIC_APP_API_URL`、`NEXT_PUBLIC_BASE_URL`。
- 生产环境会启用 Sentry 配置，相关 org/project 在 `next.config.ts` 中维护。
- `NEXT_PUBLIC_APP_API_URL` 和 `NEXT_PUBLIC_BASE_URL` 需要改为线上域名，避免页面仍请求本地接口。
- 当前演示账号密码是明文种子数据，不应直接用于生产环境。

## 开发约定

- 客户端请求优先使用 `src/lib/http.ts` 封装，保持错误处理和 refresh token 逻辑一致。
- API 返回结构建议使用 `ResponseData<T>`，并在 `src/models` 中用 Zod 维护数据模型。
- 新增页面优先沿用 `app` 目录的 App Router 结构。
- 新增业务组件放在 `src/components/layout`，可复用基础组件放在 `src/components/common`。
- 涉及 MongoDB 的新增数据结构，建议同步补充种子脚本和 README 中的数据表说明。
