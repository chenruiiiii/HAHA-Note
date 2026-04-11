import {
  LeftRecommendItemType,
  RecommendDetailType,
  RightRecommendItemType,
} from './types/recommend';

const recommendDetails: RecommendDetailType[] = [
  {
    _id: '1',
    source: {
      platform: 'yuque',
      title: '语雀专业会员支持试用MCP',
      avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=yuque',
    },
    author: {
      name: '语雀官方',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=yuque-official',
    },
    title_html: '语雀专业会员支持试用MCP',
    description_html:
      '语雀 API Token 功能现已向<strong>专业会员</strong>开放！之前只有超级会员才能使用的 Token 功能，现在专业会员也可以体验了。',
    content_html: `
      <h2 _id="usage">使用方式</h2>
      <p>专业会员可以在语雀设置页面获取 API Token，用于连接各种 AI 工具和第三方应用。</p>
      <ul>
        <li><strong>获取地址：</strong><a href="https://www.yuque.com/haha-note/api-token" target="_blank" rel="noreferrer">语雀 Token 设置页面</a></li>
        <li><strong>试用额度：</strong>每天 50 次 API 调用</li>
      </ul>
      <h2 _id="scenes">应用场景</h2>
      <p>有了 Token，你可以：</p>
      <ol>
        <li><strong>连接 AI 助手</strong>，让 Claude、ChatGPT 等 AI 工具直接读取你的语雀知识库，实现智能问答和知识检索</li>
        <li><strong>自动化工作流</strong>，通过 MCP 协议接入各种自动化工具</li>
        <li><strong>知识库管理</strong>，批量操作文档、自动整理分类</li>
        <li><strong>第三方集成</strong>，与 Obs_idian、Notion 等工具进行数据同步</li>
      </ol>
      <h2 _id="notice">使用须知</h2>
      <p>这套工具目前面向<strong>有一定技术基础的用户</strong>（熟悉命令行操作），使用前请确认：</p>
      <p><strong>前置条件：</strong></p>
      <ul>
        <li>Node.js 18+ 已安装</li>
        <li>一个支持 MCP 的 AI 工具（VS Code / Cursor / Windsurf / Claude Desktop / Trae 等）</li>
      </ul>
      <p><strong>最新更新：</strong>我们上线了全新的官网，提供了多种主流编辑器的一键安装方式，大幅简化了配置流程：<a href="https://www.yuque.com/haha-note/api-token" target="_blank" rel="noreferrer">快速体验</a></p>
      <h2 _id="doc">使用说明文档</h2>
      <p>如果你想进一步了解配置步骤、权限范围和安全建议，可以从官方文档继续查看完整说明。</p>
    `,
    quality_level: 'featured',
    like_count: 53,
    comment_count: 13,
    word_count: 389,
    source_url: 'https://www.yuque.com/haha-note/api-token',
  },
  {
    _id: '12',
    source: {
      platform: 'community',
      title: 'Next.js 15 新特性：Server Actions 全面升级',
      avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=nextjs',
    },
    author: {
      name: '前端小课',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=frontend',
    },
    title_html: 'Next.js 15 新特性：Server Actions 全面升级',
    description_html:
      '带你快速了解 Next.js 15 在 <strong>Server Actions</strong>、缓存策略和流式渲染上的新变化，适合升级前做一轮能力评估。',
    content_html: `
      <h2 _id="overview">内容概览</h2>
      <p>本文围绕 Server Actions 的增强、缓存边界优化和工程升级建议展开。</p>
    `,
    quality_level: 'normal',
    like_count: 24,
    comment_count: 5,
    word_count: 512,
    source_url: 'https://nextjs.org',
  },
  {
    _id: '13',
    source: {
      platform: 'community',
      title: 'Figma 2026 新功能：AI 辅助设计系统',
      avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=figma',
    },
    author: {
      name: '设计日记',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=design',
    },
    title_html: 'Figma 2026 新功能：AI 辅助设计系统',
    description_html: '从组件生成、变量联动到设计规范自动补全，看看 AI 是怎么进入设计系统流程的。',
    content_html: `
      <h2 _id="overview">内容概览</h2>
      <p>本文整理了 Figma 新版里和团队协作最相关的三组能力。</p>
    `,
    quality_level: 'normal',
    like_count: 17,
    comment_count: 2,
    word_count: 468,
    source_url: 'https://figma.com',
  },
];

// export const leftRecommendData: LeftRecommendItemType[] = recommendDetails.map((item) => ({
//   _id: item._id,
//   user: {
//     username: item.author.name,
//     avatar: item.author.avatar,
//   },
//   content: {
//     title: item.title_html.replace(/<[^>]+>/g, ''),
//     description: item.description_html.replace(/<[^>]+>/g, ''),
//     image: item.source.avatar,
//   },
//   likNum: item.like_count,
//   detail_url: item.source_url,
// }));

// export const rightRecommendData: RightRecommendItemType[] = recommendDetails.map((item) => ({
//   _id: item._id,
//   user: {
//     username: item.author.name,
//     signature: item.source.platform === 'yuque' ? '语雀官方推荐' : '社区精选内容',
//     avatar: item.author.avatar,
//   },
//   recommend_title: item.title_html.replace(/<[^>]+>/g, ''),
// }));

// export async function getRecommendDetailById(_id: string): Promise<RecommendDetailType | null> {
//   await new Promise((resolve) => setTimeout(resolve, 50));
//   return recommendDetails.find((item) => item._id === _id) ?? null;
// }
