## Why

知识库详情页在加载态没有撑满左右两侧父容器，侧栏和文档列表会跟随页面滚动；窄窗口下文档区还会溢出。文档保存目前只在离开页面时兜底触发，缺少 3 秒自动保存、手动保存反馈和响应业务码校验，用户无法确认保存结果。

## What Changes

- 修正知识库详情页的 flex/grid 尺寸与滚动边界，让侧栏、右侧内容区和加载态始终撑满父容器。
- 固定左侧栏，仅让文档列表在侧栏内部滚动；右侧仅让摘要与正文区域滚动，编辑器 header/toolbar 不参与滚动。
- 修复窄窗口下首页卡片固定最小宽度导致的横向溢出，并补齐响应式尺寸。
- 在 `HAEditor` 中加入 3 秒无操作防抖自动保存；标题或正文变化后重新计时。
- `Ctrl/Cmd+S` 取消待执行的自动保存并立即保存，成功或失败均使用项目全局 message 封装提示。
- 自动保存保持静默，仅在编辑器中更新保存状态；保留离页 `keepalive` 兜底。
- 校验文档保存接口的业务 `code`，非成功响应按失败处理。

## Capabilities

### New Capabilities

- `repository/detail-workspace`: 知识库详情页的容器填充、固定侧栏、分区滚动、响应式布局与文档自动保存行为。

### Modified Capabilities

无。

## Impact

- 受影响页面：`app/repo-detail/layout.tsx`、`app/repo-detail/loading.tsx`、`app/repo-detail/style.scss`、文档详情页。
- 受影响组件：`RepoSide`、`RepoDetailHome`、`HAEditor` 及其 header/toolbar/outline 样式。
- 受影响服务调用：`updateDocsDetailData` 的响应业务码处理。
- 不新增 API、数据库字段或第三方依赖。
