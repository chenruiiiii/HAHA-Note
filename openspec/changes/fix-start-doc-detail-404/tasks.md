## 1. 客户端导航修复

- [x] 1.1 `src/hooks/layer/useDoc.ts` 公开路径改为 `window.open('/public-note/${id}', '_blank', 'noopener,noreferrer')`，私有路径保持 `router.push`
- [x] 1.2 `LeftRecommendItem` / `RightRecommendItem` 的 `window.open` 改为相对路径 + `noopener,noreferrer`
- [x] 1.3 验证 `NEXT_PUBLIC_BASE_URL` 在客户端代码中不再出现（仅保留 site.ts/SEO 用途）

## 2. 首页列表导航语义与契约

- [x] 2.1 `EditDocument` / `BrowseDocument` 类型增加可选 `docs_id: string`
- [x] 2.2 `DocItem` 点击改为私有导航：`docs_id` 存在 → `/repo-detail/{repository_id}/{docs_id}`；否则 → `/repo-detail/{repository_id}/home`；`repository_id` 也缺 → 不跳转
- [ ] 2.3 Prisma `ActivityListItem` 增加 `docs_id`（映射关联 Document.id），保持裸数组契约 —— 归属 `codex/migrate-db-postgres` 分支（本 bugfix 分支不含 DAL）

## 3. 补数据脚本

- [x] 3.1 重写 `src/scripts/seed-activity.ts`：从真实 `repo_list`+`docs_detail` 生成 edit/browse 历史（真实 `repository_id`+`docs_id`，保留 `EDIT_`/`BROWSE_` id 格式）
- [x] 3.2 先清空后写入（幂等可重跑）；`repo_list`/`docs_detail` 为空时退出非零
- [ ] 3.3 验证 `npx tsx --env-file=.env.development src/scripts/index.ts activity` 可重复执行且计数正确 —— 需要可连的 MongoDB 实例（线上/开发库）执行

## 4. 迁移转换器与 CLI 对齐

- [ ] 4.1 `convertActivity` 按 `docs_id` 解析 `Activity.documentId`，查不到进 `ORPHAN_DOCUMENT` 隔离；增加 type 参数区分 `DOCUMENT_UPDATED`/`DOCUMENT_VIEWED` —— 归属 `codex/migrate-db-postgres` 分支
- [ ] 4.2 迁移 CLI 活动源扩为 edit_history + browse_history；校验 CLI 活动源计数取两集合之和 —— 归属 `codex/migrate-db-postgres` 分支
- [ ] 4.3 单测：`docs_id` 命中映射正确 + 孤儿隔离，覆盖两种活动类型 —— 归属 `codex/migrate-db-postgres` 分支

## 5. 验证

- [x] 5.1 `npx tsc --noEmit`、eslint（改动文件）全绿（本分支无 vitest 测试基建）
- [ ] 5.2 本地/预发人工验证：首页列表点击进入文档详情；逛逛推荐点开 public-note 正常 —— 需部署后验证
