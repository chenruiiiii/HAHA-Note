# Haha Note

Haha Note 是一个基于 Next.js App
Router 的知识笔记与 AI 写作应用。项目集成了文档管理、知识库浏览、收藏、公开笔记、AI 对话生成、对话记录沉淀和推荐内容浏览等能力，数据存放在托管 PostgreSQL 中（经 Prisma 访问），并保留 MongoDB 旧后端用于迁移期切换与回滚。

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
- 数据库：PostgreSQL + Prisma 7（`DATA_BACKEND=prisma`）；MongoDB 仅用于旧后端与迁移脚本
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
│   ├── lib/                     # Prisma 客户端、HTTP、事件总线、鉴权 token 等基础能力
│   ├── middleware/              # 鉴权路径配置
│   ├── models/                  # Zod schema 和类型定义
│   ├── scripts/                 # 旧 MongoDB 种子数据脚本（迁移前的数据准备）
│   ├── services/                # 客户端请求封装
│   ├── store/                   # Redux store 与 slices
│   ├── types/                   # 公共类型
│   └── utils/                   # 工具函数
├── prisma/                      # Prisma schema、迁移记录与种子入口
├── scripts/                     # 数据迁移、校验与回滚 CLI
├── proxy.ts                     # Next.js proxy，中间件鉴权逻辑入口
├── next.config.ts               # Next.js 与 Sentry 配置
└── package.json
```

## 环境要求

- Node.js：建议使用 20.x 或更高版本
- pnpm：项目使用 pnpm 10（见 `package.json` 的 `packageManager`），锁文件为 `pnpm-lock.yaml`
- PostgreSQL：`DATA_BACKEND=prisma` 时必需，用于运行时数据存储
- MongoDB：仅在使用旧后端（`DATA_BACKEND` 非 `prisma`）或执行迁移/校验/回滚脚本时需要
- DeepSeek API Key：使用 AI 对话与摘要能力时需要

## 环境变量

本地开发建议创建 `.env.development` 或 `.env.local`。不要提交真实密钥，完整模板见 `.env.example`。

```env
# 运行时 PostgreSQL（serverless 场景使用连接池地址）
DATABASE_URL=postgresql://user:password@host:5432/haha_note?sslmode=require

# Prisma CLI、迁移与 dump/restore 使用直连地址
MIGRATION_DATABASE_URL=postgresql://user:password@host:5432/haha_note?sslmode=require

# 数据后端：prisma（PostgreSQL）或 mongodb（旧后端）
DATA_BACKEND=prisma

# 旧 MongoDB 连接地址：仅 mongodb 后端与迁移/校验/回滚脚本需要
APP_MONGODB_MONGODB_URI=mongodb+srv://user:password@cluster.example.mongodb.net

# JWT 签名密钥与密码 pepper。生产环境必须设置为足够随机的长字符串
AUTH_TOKEN_SECRET=replace-with-a-strong-secret
PASSWORD_PEPPER=replace-with-a-strong-pepper

# DeepSeek API Key
DEEPSEEK_API_KEY=your_deepseek_api_key

# 浏览器侧 API 地址
NEXT_PUBLIC_APP_API_URL=http://localhost:3000/api

# 浏览器侧站点地址，用于公开笔记跳转
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

说明：

- `DATA_BACKEND` 只有**显式等于 `prisma`** 时才走 Prisma，其它取值或未设置都会走 MongoDB 旧后端（见
  `src/server/auth/backend.ts`）。
- `DATABASE_URL` 在 Prisma 模式下必填，缺失时 `src/lib/prisma.ts` 会直接抛错。
- `APP_MONGODB_MONGODB_URI` 只服务旧后端与迁移脚本；上游还兼容 `MONGODB_URI`、`MONGODB_URL`
  两个名字（见 `src/lib/mongodb.ts`）。
- `DEEPSEEK_API_KEY` 影响 `/api/chat-detail` 和 `/api/docs-summary/[docsId]` 等 AI 接口，可用
  `AI_PROVIDER_BASE_URL`、`AI_CHAT_MODEL` 覆盖默认网关与模型。
- `AUTH_TOKEN_SECRET` 有开发兜底值，但生产环境必须显式配置；`PASSWORD_PEPPER`
  未配置时为空串，生产环境同样必须显式配置。
- `LEGACY_OWNER_ID`（`pnpm data:migrate` 必需）与 `CUTOVER_TIMESTAMP`（`pnpm rollback:reverse-sync`
  必需）只在迁移期使用。

## 本地启动

安装依赖：

```bash
pnpm install
```

启动开发服务器：

```bash
pnpm dev
```

浏览器打开：

```text
http://localhost:3000
```

构建生产包：

```bash
pnpm build
```

启动生产服务：

```bash
pnpm start
```

## 数据库与迁移

数据访问统一收口在 `src/server/dal`，由 `DATA_BACKEND` 决定读哪一侧：

- **Prisma 模式**：DAL 读写 PostgreSQL。Prisma Client 生成到
  `src/generated/prisma`（已被 gitignore，`predev` / `prebuild` 会自动执行
  `prisma generate`，新 clone 无需手动生成）。
- **MongoDB 模式**：保留迁移前的实现，只作为回滚路径。

Schema 与迁移：

```bash
pnpm db:generate    # 生成 Prisma Client
pnpm db:migrate     # 本地开发：创建并应用迁移（prisma migrate dev）
pnpm db:deploy      # 生产环境应用既有迁移（prisma migrate deploy）
pnpm db:validate    # 校验 Prisma schema
```

MongoDB → PostgreSQL 的一次性迁移与回滚：

```bash
pnpm data:migrate:dry       # 只读取与转换，不写库
pnpm data:migrate           # 写入 PostgreSQL，需要 LEGACY_OWNER_ID
pnpm data:validate          # 切流前核对源/目标计数与隔离区；critical > 0 时不应切流
pnpm rollback:reverse-sync  # 回滚：把 cutover 之后的改动反向同步回 MongoDB
```

迁移阶段划分、验收标准与回滚预案见 `docs/HAHA-Note-Migration-Guide.md`。

## 数据初始化

`src/scripts/*` 是**旧 MongoDB**
的种子脚本（直接写 database/collection），用于旧后端或迁移演练前准备数据；脚本默认读取
`.env.development`：

```bash
pnpm seed
```

该命令等价于填充知识库数据：

```bash
pnpm exec tsx --env-file=.env.development src/scripts/index.ts repos
```

初始化管理员账号：

```bash
pnpm seed:admin
```

可用任务：

```bash
pnpm exec tsx --env-file=.env.development src/scripts/index.ts repos
pnpm exec tsx --env-file=.env.development src/scripts/index.ts docs
pnpm exec tsx --env-file=.env.development src/scripts/index.ts activity
pnpm exec tsx --env-file=.env.development src/scripts/index.ts favorite
pnpm exec tsx --env-file=.env.development src/scripts/index.ts ai-chat
pnpm exec tsx --env-file=.env.development src/scripts/index.ts admin
pnpm exec tsx --env-file=.env.development src/scripts/index.ts stroll
pnpm exec tsx --env-file=.env.development src/scripts/index.ts all
```

PostgreSQL 侧没有独立的种子数据：`pnpm db:seed`（`prisma/seed.ts`）是有意的空实现，只提示改用
`pnpm data:migrate` 迁移历史数据。

开发环境内置演示账号：

| 账号     | 密码        | 角色     |
| -------- | ----------- | -------- |
| `admin`  | `admin`     | 管理员   |
| `editor` | `editor123` | 内容编辑 |

这些账号只适合本地开发或演示，生产环境请改为真实用户体系或至少更换密码。

## 常用脚本

| 命令              | 说明                        |
| ----------------- | --------------------------- |
| `pnpm dev`        | 启动 Next.js 开发服务器     |
| `pnpm build`      | 构建生产版本                |
| `pnpm start`      | 启动生产服务                |
| `pnpm lint`       | 运行 ESLint                 |
| `pnpm typecheck`  | 运行 TypeScript 类型检查    |
| `pnpm test`       | 运行 Vitest 单元测试        |
| `pnpm seed`       | 旧 MongoDB 种子：知识库数据 |
| `pnpm seed:admin` | 旧 MongoDB 种子：管理员账号 |

数据库与迁移相关命令（`db:*`、`data:*`、`rollback:*`）见上文「数据库与迁移」。

## 主要页面

| 路径                             | 说明                           |
| -------------------------------- | ------------------------------ |
| `/`                              | 开始页，展示文档入口与最近记录 |
| `/repository`                    | 知识库列表                     |
| `/repo-detail/[repoId]/home`     | 知识库首页                     |
| `/repo-detail/[repoId]/[fileId]` | 知识库文档详情                 |
| `/ai-chat-home`                  | AI 写作首页                    |
| `/ai-chat/[id]`                  | AI 对话详情                    |
| `/collect`                       | 收藏页                         |
| `/stroll`                        | 漫游推荐                       |
| `/stroll-recommend/[id]`         | 推荐详情                       |
| `/public-note/[id]`              | 公开笔记                       |
| `/personal-center/[id]`          | 个人中心                       |
| `/login`                         | 登录页                         |

## 主要接口

| 接口                         | 说明                    |
| ---------------------------- | ----------------------- |
| `/api/login`                 | 登录并写入鉴权 Cookie   |
| `/api/logout`                | 退出登录并清理 Cookie   |
| `/api/auth/refresh`          | 刷新 access token       |
| `/api/repository`            | 获取知识库列表          |
| `/api/repo-detail/[id]`      | 获取知识库详情          |
| `/api/docs-detail/[docsId]`  | 获取文档详情            |
| `/api/docs-summary/[docsId]` | 生成文档摘要            |
| `/api/chat-detail`           | AI 流式对话与会话持久化 |
| `/api/chat/[id]`             | 获取 AI 会话详情        |
| `/api/chat-latest-mission`   | 获取最近 AI 会话        |
| `/api/chat-collect-mission`  | 获取收藏 AI 会话        |
| `/api/start/edited`          | 获取最近编辑记录        |
| `/api/start/browsed`         | 获取最近浏览记录        |
| `/api/public-note/[id]`      | 获取公开笔记            |
| `/api/stroll/left`           | 获取左侧推荐列表        |
| `/api/stroll/right`          | 获取右侧推荐列表        |

## 鉴权说明

登录成功后，服务端会写入两个 HttpOnly Cookie：

- `ha_note_access_token`：短期 access token，默认 15 分钟。
- `ha_note_refresh_token`：长期 refresh token，默认 7 天。

`src/lib/http.ts` 会在接口返回 401 时尝试调用 `/api/auth/refresh` 自动刷新登录态。`proxy.ts`
中保留了完整的页面级鉴权逻辑，不过当前 `proxy()`
默认直接放行，方便开发调试；需要恢复页面鉴权时，可以将入口切换到 `authProxyWithLogin`。

## 数据库说明

`prisma/schema.prisma` 中的主要模型（`DATA_BACKEND=prisma` 时生效）：

| 模型                                                     | 用途                                             |
| -------------------------------------------------------- | ------------------------------------------------ |
| `User` / `Session`                                       | 账号与登录会话（refresh token 存哈希）           |
| `Repository` / `RepositoryMember` / `RepositoryFavorite` | 知识库、成员关系与收藏                           |
| `Document` / `DocumentRevision`                          | 文档正文（TipTap JSON + HTML 缓存）与版本快照    |
| `DocumentFavorite` / `DocumentShareLink`                 | 文档收藏与分享链接                               |
| `Conversation` / `Message`                               | AI 对话与消息                                    |
| `Activity`                                               | 最近编辑 / 最近浏览等用户活动（首页列表来源）    |
| `ExploreArticle`                                         | 漫游推荐内容，也是公开笔记的数据源               |
| `PerformanceEvent`                                       | RUM 性能事件                                     |
| `Asset` / `MessageAsset`                                 | 多媒体资源元数据（模型已建，多模态能力尚未接入） |

旧 MongoDB 集合与上表的对应关系以 `scripts/validate-migration.ts` 的 `SOURCE_SPEC` 为准（例如
`ha_admin.users` → `User`、`repository.docs_detail` →
`Document`、`stroll-recommend.recommend_details` → `ExploreArticle`）。`DATA_BACKEND` 不是 `prisma`
时，应用仍会读写这些旧集合。

## 部署注意事项

- 在 Vercel 或其他平台部署时，至少需要配置
  `DATABASE_URL`、`DATA_BACKEND=prisma`、`AUTH_TOKEN_SECRET`、`PASSWORD_PEPPER`、`DEEPSEEK_API_KEY`、`NEXT_PUBLIC_APP_API_URL`、`NEXT_PUBLIC_BASE_URL`；使用旧后端时再加
  `APP_MONGODB_MONGODB_URI`。
- 生产数据库只运行 `pnpm db:deploy`（`prisma migrate deploy`），不要执行 `migrate dev` 或
  `db push`。
- 生产环境会启用 Sentry 配置，相关 org/project 在 `next.config.ts` 中维护。
- `NEXT_PUBLIC_APP_API_URL` 和 `NEXT_PUBLIC_BASE_URL` 需要改为线上域名，避免页面仍请求本地接口。
- 演示账号由旧 MongoDB 种子脚本以明文密码写入，不应直接用于生产环境。

## 开发约定

- 客户端请求优先使用 `src/lib/http.ts` 封装，保持错误处理和 refresh token 逻辑一致。
- API 返回结构建议使用 `ResponseData<T>`，并在 `src/models` 中用 Zod 维护数据模型。
- 新增页面优先沿用 `app` 目录的 App Router 结构。
- 新增业务组件放在 `src/components/layout`，可复用基础组件放在 `src/components/common`。
- 涉及数据结构的改动，先改 `prisma/schema.prisma`
  并生成迁移，同时更新本文件的数据表说明；若影响迁移，一并更新 `scripts/validate-migration.ts` 的
  `SOURCE_SPEC`。
