## Context

首页文档列表点击 404（`/undefined/public-note/EDIT_xxx`）。三个独立缺陷叠加：客户端跳转依赖未配置的构建期 env、活动条目被硬编码当公开笔记跳转、活动数据缺少真实文档引用。生产环境走 Mongo 后端，本地开发因 `.env.development` 配置了 base URL 而未暴露。

## Goals / Non-Goals

**Goals**
- 任何环境下首页文档列表点击都能进入有效详情页。
- 客户端导航不再依赖环境变量（同源相对路径）。
- 补数据脚本使活动列表引用真实知识库与文档，且双后端（Mongo/Prisma）DTO 契约一致。

**Non-Goals**
- 不改变 Start 页的筛选/展示交互。
- 不为 Mongo 活动数据引入 `isPublic` 概念（列表条目一律按私有文档处理）。
- 不重写逛逛页公开笔记导航语义，只修 URL 构造方式。

## Decisions

- 客户端 `window.open`/`router.push` 一律使用相对路径；`NEXT_PUBLIC_BASE_URL` 仅用于服务端 SEO（`site.ts` 的 `buildAbsoluteUrl` 已对 undefined 返回 undefined 并省略元数据，行为不变）。
- 首页列表条目 = 私有工作区文档：导航目标 `/repo-detail/{repository_id}/{docs_id}`；`docs_id` 缺失回退知识库首页 `/repo-detail/{repository_id}/home`；`repository_id` 也缺失则点击不跳转（防御历史脏数据）。
- `EditDocument`/`BrowseDocument` 增加可选 `docs_id: string`——旧数据没有该字段也能渲染，只是降级导航。
- Prisma `ActivityListItem` 输出 `docs_id`（来自关联 Document.id），裸数组契约不变。
- 补数据脚本采用「先清空后写入」：两个活动集合是可再生演示数据，重跑幂等；`repo_list`/`docs_detail` 为空时直接退出非零，防止把线上列表清成空。
- 迁移转换器 `convertActivity` 按 `docs_id` 解析文档，查不到进隔离区（`ORPHAN_DOCUMENT`），沿用迁移 spec 的保守隔离要求；edit_history → `DOCUMENT_UPDATED`，browse_history → `DOCUMENT_VIEWED`。
- 校验 CLI 的活动源计数 = edit_history + browse_history 之和，与目标 activity 行数比对。

## Grill-me Boundary Decisions

1. **环境变量边界**：构建期内联是 Next.js 的既定行为，修法是「相对路径」而非「给生产补配 env」——补配只能修这一个症状，同类代码仍会埋雷。`NEXT_PUBLIC_BASE_URL` 从此仅允许出现在服务端 SEO 代码（`site.ts`/`sitemap`/`robots`/metadata）。
2. **公开/私有判定边界**：`isPublic` 参数保留在 `useDoc.handleToDetail` 签名中（逛逛详情复用公开路径），但 Start 列表固定传 `false`。判定依据是**数据来源**（活动=私有），不信任任何请求/数据里的标志位。
3. **降级导航边界**：`docs_id` 缺失 → 知识库首页；`repository_id` 缺失 → 不跳转。不做「猜一个相近页面」的兜底；宁可点击无反应也不进 404 页。部署后未跑补数据脚本前的旧脏数据走降级路径。
4. **数据脚本破坏性边界**：只允许清空 `user_activity.edit_history`/`browse_history` 两个可再生演示集合；绝不动 `repo_list`/`docs_detail`/`docs_summary` 等业务集合。源数据为空时退出非零。
5. **双后端契约边界**：`docs_id` 必须同时进 Mongo 种子数据与 Prisma DTO，字段名一致；切库前后前端代码不需要感知后端差异。
6. **迁移映射边界**：历史脏数据（无 `docs_id` 或引用不存在的文档）一律隔离并出现在报告里，不静默丢弃、不猜测归属——沿用迁移 spec「保守隔离」既有要求。
7. **`noopener,noreferrer`**：所有 `window.open` 补齐第三参，防止新开页拿到 `window.opener` 反向操控来源页（仓库内已有该模式的先例 `handleOpenSource`）。
8. **验证边界**：单测覆盖迁移转换器的 `docs_id` 映射与孤儿隔离；前端 hook 无测试基建（无 jsdom/RTL），以 `tsc` + `eslint` + 人工验证为准，不为此引入前端测试栈（非目标）。

## Risks / Trade-offs

- 生产部署后、补数据执行前，旧活动条目点击会落到「知识库首页（可能 404）」的降级路径——窗口期短且优于现状（现状必 404）；补数据脚本随本变更一同交付，部署后立即执行。
- `repository_id` 指向不存在知识库时，repo-detail 页自身会展示未找到——属于数据问题，由补数据脚本消除。
- 逛逛页两处 `window.open` 一并修改，改动面略超「首页 404」本身，但同根因同修，避免生产上换个入口继续踩。
