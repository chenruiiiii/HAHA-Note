# 个人笔记项目 - 代码开发规范

## 📁 项目简介

这是一个基于 Next.js 的 SSR+CSR 混合渲染个人笔记项目，类似语雀的知识库系统。主要技术栈：Next.js + ```typescript + SCSS + Ant Design + Redux Toolkit + Axios。

## 📋 命名规范

### 文件命名
✅ 正确：note-editor.tsx, auth-api.ts, user-model.ts
❌ 错误：NoteEditor.tsx, authApi.ts, UserModel.ts
**规则：** 所有文件、文件夹使用 kebab-case（短横线分隔）

### 变量命名
``````typescript
// camelCase
const userName = '张三';
let isLoading = false;
// 布尔值：is/has/can/should 开头
const isVisible = true;
const hasPermission = false;
const canEdit = true;
// 数组：复数形式
const users = [];
const noteList = [];
// 常量：UPPER_SNAKE_CASE
const API_TIMEOUT = 30000;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
```

### 函数命名
```typescript
// 动词开头
function fetchUserData() {}
function handleSubmit() {}
function validateForm() {}
// 返回布尔值
function isUserValid() {}
function hasRequiredFields() {}
// 事件处理
const handleInputChange = () => {}
const onSaveComplete = () => {}
```

### 组件命名
```typescript
// PascalCase
export const NoteEditor: React.FC<NoteEditorProps> = () => {}
// 高阶组件：with前缀
const withAuth = (Component) => {}
// 自定义Hook：use前缀
const useNoteList = () => {}
```

### typescript 类型
```typescript
// 接口：I前缀
interface INote {
id: string;
title: string;
content: string;
createdAt: Date;
}
// 类型别名：T前缀
type TNoteStatus = 'draft' | 'published' | 'archived';
// Props类型：组件名+Props
interface NoteCardProps {
note: INote;
onEdit?: (id: string) => void;
isSelected?: boolean;
}
```

## 🏗️ 项目结构
```bash
src/
├── components/ # 公共组件
│ ├── common/ # 通用组件
│ ├── layout/ # 布局组件
│ └── ui/ # UI基础组件
├── pages/ # 页面文件
│ ├── api/ # API路由
│ ├── knowledge/ # 知识库页面
│ ├── editor/ # 编辑器页面
│ └── _app.tsx # 应用入口
├── store/ # 状态管理
│ ├── slices/ # Redux切片
│ ├── hooks.ts # Redux Hooks
│ └── index.ts # store配置
├── utils/ # 工具函数
│ ├── api/ # API封装
│ ├── format/ # 格式化工具
│ └── constants.ts # 常量定义
├── styles/ # 全局样式
├── types/ # 类型定义
└── hooks/ # 自定义Hooks
```
## 💻 代码规范

### 函数长度限制
**规则：** 单个函数不超过300行代码
```typescript
// ❌ 不好：函数过长
async function handleComplexOperation() {
// 300+ 行代码
}
// ✅ 好：拆分为小函数
async function processNote() {
const note = await validateNote();
const content = await formatContent();
return await saveNote(note);
}
```
### 组件复杂度控制
```tsx
// ❌ 不好：组件职责过多
const ComplexComponent = () => {
// 数据获取 + 表单处理 + 业务逻辑 + 样式
return <div>...</div>
}
// ✅ 好：职责分离
const CleanComponent = () => {
const { data } = useData();
const { form } = useForm();
return (
<div>
<Header title={data.title} />
<Form form={form} />
<Actions />
</div>
);
};
```
### 导入顺序
```typescript
// 1. 第三方库
import React, { useState } from 'react';
import { Button, Input } from 'antd';
// 2. 项目组件
import NoteEditor from '@/components/note-editor';
// 3. 工具函数
import { formatDate } from '@/utils/date';
// 4. 类型
import type { INote } from '@/types/note';
// 5. 样式
import './styles.scss';
```

## 🌿 Git 工作流

### 分支策略
main (生产环境，保护分支)
└── develop (开发分支，功能完成后合并)
├── feature-* (新功能开发)
├── bugfix-*(问题修复)
├── hotfix-* (紧急修复)
└── release-* (版本发布)

### 分支命名示例
```bash
功能开发
git checkout -b feature/add-md-editor
git checkout -b feature/ai-summary
Bug修复
git checkout -b bugfix/fix-save-error
git checkout -b hotfix/login-issue
```
### 提交信息规范

> 格式：`<type>(<scope>): <subject>`

**type 类型：**
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建工具
- `perf`: 性能优化

**示例：**
```bash
git commit -m "feat(editor): 添加Markdown实时预览功能"
git commit -m "fix(auth): 修复登录token过期问题"
git commit -m "docs(readme): 更新项目启动说明"
git commit -m "refactor(api): 重构笔记接口层"
```

## 🔄 SSR/CSR 混合策略

### 适合 SSR 的页面
```typescript
// 需要SEO、首次加载快的页面
公开笔记/博客文章
用户个人主页
介绍页/着陆页
知识库公开页面
// 使用 getServerSideProps
export const getServerSideProps: GetServerSideProps = async (context) => {
// 服务器端获取数据
return { props: { data } };
};
```
### 适合 CSR 的页面
```typescript
// 交互复杂、私密的页面
笔记编辑器（自动保存、复杂交互）
个人笔记列表（登录后）
设置页面
后台管理
// 客户端获取数据
const EditorPage = () => {
const { data, loading } = useSWR('/api/notes');
// ...
};
```
## 🎯 实习项目注意事项

### 学习重点
1. **typescript类型安全** - 充分利用类型检查
2. **Next.js混合渲染** - 理解SSR/CSR适用场景
3. **状态管理** - Redux Toolkit实际使用
4. **性能优化** - 代码分割、懒加载、虚拟滚动
5. **错误处理** - 完善的错误边界和提示

### 代码审查要点
1. 函数是否超过300行？
2. 组件职责是否单一？
3. typescript类型是否完整？
4. 错误处理是否完备？
5. 是否有明显的性能问题？

### 项目特色实现
1. **自动保存** - 防抖处理的保存逻辑
2. **AI摘要生成** - 千问API集成
3. **二维码分享** - 公开文档分享功能
4. **性能检测SDK** - 埋点和性能监控
5. **多语言支持** - i18n国际化

## 📚 推荐学习资源

### 必看文档
- [Next.js 官方文档](https://nextjs.org/docs)
- [typescript Handbook](https://www.```typescriptlang.org/docs/handbook/intro.html)
- [Redux Toolkit 使用指南](https://redux-toolkit.js.org/introduction/getting-started)
- [Ant Design 组件库](https://ant.design/components/overview/)

### 实战博客
- [Next.js SSR/CSR最佳实践](https://nextjs.org/docs/basic-features/pages)
- [typescript在React中的实践](https://react-```typescript-cheatsheet.netlify.app/)
- [前端性能优化指南](https://web.dev/performance/)

---

## 📋 快速检查清单

开始编码前检查：
- [ ] 文件名是否正确（kebab-case）
- [ ] 组件命名是否符合PascalCase
- [ ] typescript类型是否定义完整
- [ ] 函数是否可能过长（考虑拆分）
- [ ] 错误处理是否完善
- [ ] 提交信息格式是否正确

提交代码前检查：
- [ ] 代码是否通过typescript检查
- [ ] 功能是否按预期工作
- [ ] 控制台是否有错误/警告
- [ ] 提交信息是否规范

---

**维护人：** 项目开发者
**最后更新：** 2026年3月
**目标：** 打造高质量、易维护的个人项目，助力实习和求职
