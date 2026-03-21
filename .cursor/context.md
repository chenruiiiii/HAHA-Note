# 项目上下文记忆

## 🎯 项目目标
- 构建有特色的个人项目，用于简历展示
- 学习实际业务开发技能
- 实现SSR/CSR混合渲染最佳实践

## 👤 开发者背景
- 前端实习生，大三
- 熟悉React基础，缺乏实际业务经验
- 需要学习：埋点、缓存策略、SDK集成、i18n、中间件

## 🏗️ 架构要点
1. **混合渲染策略**：
   - 公开内容SSR (SEO友好)
   - 私有内容CSR (交互丰富)
   - 动态路由支持两种模式

2. **状态管理**：
   - 服务端状态：Next.js Server Components
   - 客户端状态：Redux Toolkit
   - 服务器状态缓存：RTK Query

3. **性能优化**：
   - 首屏加载<2s
   - 使用Performance SDK监控
   - 实现组件级缓存

## 🔧 关键技术实现

### 自动保存功能

## 🎨 前端开发规范

### 组件开发规范
1. **样式管理**：
   - 使用 Tailwind CSS 进行样式开发
   - 字体颜色、大小统一使用 `var.scss` 中的 SCSS 变量
   - 响应式设计使用 `common.scss` 中的公共样式类
   - 避免在 SCSS 中使用 `@apply` 指令，改用标准 SCSS 属性
   - **SCSS 模块导入**：使用 `@use` 指令替代 `@import`，并使用命名空间：
     ```scss
     @use '@/assets/styles/var.scss';
     @use '@/assets/styles/common.scss";
     ```
   - 变量引用使用命名空间前缀：`var.$font-size-md`、`common.f-sb`

2. **图标使用**：
   - 所有 `i` 标签必须添加 `iconfont` 类选择器
   - 图标类名按照设计规范使用，如：`iconfont icon-wenjian`
   - **Ant Design 图标**：优先使用 Ant Design 内置图标，如 `PlusOutlined`、`UserOutlined`、`UpOutlined`
   - 自定义字体图标仅在 Ant Design 图标不足时使用

3. **常量管理**：
   - 组件中的静态文本和配置数据提取为常量
   - 存放在 `src/constants/config.ts/` 目录下对应模块文件中
   - 常量格式参考 `index.ts` 中的 `WEBSITE_INFO` 结构
   - 使用 TypeScript 类型定义确保类型安全

4. **组件结构**：
   - 导入常量使用 `@/` 别名路径
   - 使用 `map` 方法遍历数组数据渲染列表
   - 为列表项添加唯一的 `key` 属性

5. **代码组织**：
   - 保持组件的单一职责原则
   - 使用语义化 HTML 标签
   - 合理使用 CSS 类名和样式继承

6. **输入组件开发**：
   - **ChatInput 组件**：使用 Ant Design 的 `Input.TextArea`、`Button`、`Dropdown` 组件
   - **状态管理**：使用 `useState` 管理输入值和交互状态
   - **事件处理**：实现 `Enter` 键发送、点击发送等交互逻辑
   - **样式规范**：圆形按钮、边框样式、悬停效果、焦点状态
   - **响应式设计**：移动端适配，按钮尺寸和间距调整
