## Why

线上（https://haha-note.vercel.app）从首页「文档」列表（编辑过/浏览过）点击条目跳转到 `/undefined/public-note/EDIT_xxx`，返回 404。排查确认三层叠加原因：

1. `src/hooks/layer/useDoc.ts` 用构建期内联的 `process.env.NEXT_PUBLIC_BASE_URL` 拼客户端跳转 URL；Vercel 生产未配置该变量，`undefined` 被拼成路径首段。本地 `.env.development` 有值所以从未暴露。
2. `DocItem` 硬编码 `handleToDetail(true, _id)`：把私有工作区活动记录 id（`EDIT_*`）当公开笔记 id 跳 `public-note`；该路由只解析逛逛文章 id，语义上必然 404。
3. Mongo `edit_history`/`browse_history` 种子数据 `repository_id` 为随机 nanoid 且没有文档引用，正确目标 `/repo-detail/{repoId}/{docsId}` 缺少 `docs_id` 无法构造。

逛逛页 `LeftRecommendItem` / `RightRecommendItem` 存在与 1 相同的 env 拼 URL 问题（同一根因，生产同样 404）。

注：git 历史显示 `useDoc.ts`/`DocItem` 最后改动于 `7a7237f`（早于迁移分支），线上 URL 带 `EDIT_` 前缀说明生产仍走 Mongo 后端——本 bug 与 MongoDB→PostgreSQL 迁移设计无关，是潜伏缺陷在生产暴露；但修复必须同时覆盖双后端，避免切库后回归。

## What Changes

- 客户端跳转一律改为同源相对路径：`useDoc` 公开路径、逛逛左右推荐项的 `window.open` 改为 `/public-note/${id}` 并补 `noopener,noreferrer`；`NEXT_PUBLIC_BASE_URL` 仅保留给服务端 SEO 元数据（`src/lib/site.ts` 已做 undefined 安全）。
- 首页文档列表条目改为私有文档导航：`EditDocument`/`BrowseDocument` 类型增加可选 `docs_id`；`DocItem` 优先跳 `/repo-detail/{repository_id}/{docs_id}`，缺 `docs_id` 时回退 `/repo-detail/{repository_id}/home`，两者皆缺则不跳转；不再硬编码 `isPublic=true`。
- Prisma 侧 `ActivityListItem` DTO 增加 `docs_id`（取 Activity.documentId 对应文档），保持裸数组契约与 Mongo 一致。
- 补数据脚本：重写 `src/scripts/seed-activity.ts`，从真实 `repo_list` + `docs_detail` 生成编辑/浏览历史（携带真实 `repository_id` 与 `docs_id`，保留 `EDIT_`/`BROWSE_` id 格式），先清空后写入、可重跑；源集合为空时拒绝执行避免清空线上列表。
- 迁移转换器修正：`convertActivity` 改用 `docs_id` 解析 `Activity.documentId`（原实现误用 `repository_id` 查文档），edit→`DOCUMENT_UPDATED`、browse→`DOCUMENT_VIEWED`，解析失败按既有 spec 进隔离区；迁移/校验 CLI 的活动源扩为 edit_history + browse_history 两个集合并汇总计数。

## Capabilities

### Modified Capabilities

- `database/postgresql-data-layer`：Activity DTO 增加 `docs_id` 字段（双后端契约对齐）。
- `database/mongodb-to-postgresql-migration`：活动映射改为按 `docs_id` 解析文档外键，孤儿活动隔离规则不变。

（本变更为缺陷修复，不新增 capability；以上为既有迁移 change 的 spec 增补，随该 change 一并生效。）

## Impact

- 受影响代码：`src/hooks/layer/useDoc.ts`、`src/components/layout/Start/components/DocItem/index.tsx`、`src/components/layout/Start/types/list.ts`、`src/components/layout/Stroll/components/{Left,Right}RecommendItem/index.tsx`、`src/server/dal/activities.ts`、`src/scripts/seed-activity.ts`、`scripts/migrate-core.ts`、`scripts/migrate-mongo-to-postgres.ts`、`scripts/validate-migration.ts`。
- 数据：`user_activity.edit_history` / `browse_history` 将被演示脚本重建（先删后插）；需运维在部署后对生产 Mongo 执行一次补数据。
- 非目标：不引入新的公开笔记入口语义；不改 Start 页 UI/交互；不处理 `src/constants/env-var.ts` 的 localhost 硬编码常量（无实际缺陷）；PersonalCenter 的 `|| '/'` 兜底写法保持不变。
