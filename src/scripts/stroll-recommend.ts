import clientPromise from '../lib/mongodb';
import { recommendDetailListModelSchema } from '../models/stroll-recommend';

const DATABASE_NAME = 'stroll-recommend';
const COLLECTION_NAME = 'recommend_details';

const recommendSeedData = recommendDetailListModelSchema.parse([
  {
    id: '1',
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
      <h2 id="usage">使用方式</h2>
      <p>专业会员可以在语雀设置页面获取 API Token，用于连接各种 AI 工具和第三方应用。</p>
      <ul>
        <li><strong>获取地址：</strong><a href="https://www.yuque.com/haha-note/api-token" target="_blank" rel="noreferrer">语雀 Token 设置页面</a></li>
        <li><strong>试用额度：</strong>每天 50 次 API 调用</li>
      </ul>
      <h2 id="scenes">应用场景</h2>
      <p>有了 Token，你可以：</p>
      <ol>
        <li><strong>连接 AI 助手</strong>，让 Claude、ChatGPT 等 AI 工具直接读取你的语雀知识库，实现智能问答和知识检索</li>
        <li><strong>自动化工作流</strong>，通过 MCP 协议接入各种自动化工具</li>
        <li><strong>知识库管理</strong>，批量操作文档、自动整理分类</li>
        <li><strong>第三方集成</strong>，与 Obsidian、Notion 等工具进行数据同步</li>
      </ol>
      <h2 id="notice">使用须知</h2>
      <p>这套工具目前面向<strong>有一定技术基础的用户</strong>（熟悉命令行操作），使用前请确认：</p>
      <p><strong>前置条件：</strong></p>
      <ul>
        <li>Node.js 18+ 已安装</li>
        <li>一个支持 MCP 的 AI 工具（VS Code / Cursor / Windsurf / Claude Desktop / Trae 等）</li>
      </ul>
      <p><strong>最新更新：</strong>我们上线了全新的官网，提供了多种主流编辑器的一键安装方式，大幅简化了配置流程：<a href="https://www.yuque.com/haha-note/api-token" target="_blank" rel="noreferrer">快速体验</a></p>
      <h2 id="doc">使用说明文档</h2>
      <p>如果你想进一步了解配置步骤、权限范围和安全建议，可以从官方文档继续查看完整说明。</p>
    `,
    quality_level: 'featured',
    like_count: 53,
    comment_count: 13,
    word_count: 389,
    source_url: 'https://www.yuque.com/haha-note/api-token',
  },
  {
    id: '12',
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
      <h2 id="overview">内容概览</h2>
      <p>本文围绕 Server Actions 的增强、缓存边界优化和工程升级建议展开。</p>
    `,
    quality_level: 'normal',
    like_count: 24,
    comment_count: 5,
    word_count: 512,
    source_url: 'https://nextjs.org',
  },
  {
    id: '13',
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
      <h2 id="overview">内容概览</h2>
      <p>本文整理了 Figma 新版里和团队协作最相关的三组能力。</p>
    `,
    quality_level: 'normal',
    like_count: 17,
    comment_count: 2,
    word_count: 468,
    source_url: 'https://figma.com',
  },
  // ... 接在你原有的数组后面，已修正 platform 校验错误
  {
    id: '14',
    source: {
      platform: 'community',
      title: 'Rust 2026：为什么它依然是系统编程的首选',
      avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=rust',
    },
    author: {
      name: '底层修仙者',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rust-dev',
    },
    title_html: 'Rust 2026：为什么它依然是系统编程的首选',
    description_html: '探讨 Rust 在<strong>内存安全</strong>和并发模型上的持续领先地位。',
    content_html: '<h2 id="core">核心竞争力</h2><p>借用检查器与无畏并发依然是其杀手锏。</p>',
    quality_level: 'featured',
    like_count: 89,
    comment_count: 21,
    word_count: 1200,
    source_url: 'https://rust-lang.org',
  },
  {
    id: '15',
    source: {
      platform: 'community',
      title: 'Vue 4.0 路线图预览',
      avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=vue',
    },
    author: { name: '尤大粉', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vue-fan' },
    title_html: 'Vue 4.0 路线图预览：极简主义回归',
    description_html: 'Vue 4.0 将进一步优化<strong>体积与响应式系统</strong>。',
    content_html: '<p>更轻量的 API，更智能的编译优化。</p>',
    quality_level: 'normal',
    like_count: 45,
    comment_count: 12,
    word_count: 850,
    source_url: 'https://vuejs.org',
  },
  {
    id: '16',
    source: {
      platform: 'community',
      title: '程序员如何度过 35 岁危机',
      avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=career',
    },
    author: {
      name: '架构师老王',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=laowang',
    },
    title_html: '程序员如何度过 35 岁危机',
    description_html: '从<strong>技术广度到管理深度</strong>的转型实操建议。',
    content_html: '<p>建立自己的个人品牌和技术护城河。</p>',
    quality_level: 'featured',
    like_count: 156,
    comment_count: 42,
    word_count: 2100,
    source_url: 'https://zhihu.com',
  },
  {
    id: '17',
    source: {
      platform: 'community',
      title: 'Bun 2.0 正式发布',
      avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=bun',
    },
    author: { name: 'Jarred', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jarred' },
    title_html: 'Bun 2.0 正式发布：速度再提升 30%',
    description_html: '全栈运行时的巅峰，完美替代 Node.js。',
    content_html: '<p>原生支持打包、测试和包管理。</p>',
    quality_level: 'featured',
    like_count: 320,
    comment_count: 56,
    word_count: 670,
    source_url: 'https://bun.sh',
  },
  {
    id: '18',
    source: {
      platform: 'community',
      title: 'Tailwind CSS v4 深度解析',
      avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=tailwind',
    },
    author: { name: 'Adam W.', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=adam' },
    title_html: 'Tailwind CSS v4 深度解析',
    description_html: '全新的 <strong>Engine</strong>，让构建速度快到飞起。',
    content_html: '<p>零配置时代正式开启。</p>',
    quality_level: 'normal',
    like_count: 67,
    comment_count: 8,
    word_count: 940,
    source_url: 'https://tailwindcss.com',
  },
  {
    id: '19',
    source: {
      platform: 'yuque',
      title: '团队知识库建设指南',
      avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=yuque',
    },
    author: { name: '效率专家', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=expert' },
    title_html: '团队知识库建设指南',
    description_html: '如何通过语雀构建企业级的<strong>异步协作文化</strong>。',
    content_html: '<p>沉淀、索引、分发：三步走战略。</p>',
    quality_level: 'normal',
    like_count: 31,
    comment_count: 4,
    word_count: 1500,
    source_url: 'https://yuque.com',
  },
  {
    id: '20',
    source: {
      platform: 'community',
      title: 'WebGPU 开发入门',
      avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=gpu',
    },
    author: {
      name: '图形学大佬',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=graphics',
    },
    title_html: 'WebGPU 开发入门：解锁浏览器算力',
    description_html: '告别 WebGL，拥抱更底层的浏览器图形接口。',
    content_html: '<p>如何在 Web 端实现电影级的渲染效果。</p>',
    quality_level: 'normal',
    like_count: 92,
    comment_count: 15,
    word_count: 2300,
    source_url: 'https://webgpu.org',
  },
  {
    id: '21',
    source: {
      platform: 'community',
      title: '2026 前端薪资现状调研',
      avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=bilibili',
    },
    author: { name: '全栈老毕', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=laobi' },
    title_html: '2026 前端薪资现状调研：AI 到底取代了谁？',
    description_html: '深入分析<strong>初级前端</strong>的生存空间与进阶路径。',
    content_html: '<p>拥抱 AI 工具的工程师薪资反升 20%。</p>',
    quality_level: 'featured',
    like_count: 442,
    comment_count: 120,
    word_count: 300,
    source_url: 'https://bilibili.com',
  },
  {
    id: '22',
    source: {
      platform: 'community',
      title: 'React 19 最佳实践',
      avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=react',
    },
    author: { name: 'Hooks大师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hooks' },
    title_html: 'React 19 最佳实践：别再乱用 useMemo 了',
    description_html: '新编译器如何帮你处理优化逻辑。',
    content_html: '<p>自动记忆化带来的性能变革。</p>',
    quality_level: 'normal',
    like_count: 112,
    comment_count: 22,
    word_count: 1100,
    source_url: 'https://react.dev',
  },
  {
    id: '23',
    source: {
      platform: 'community',
      title: 'Shadcn/UI 为什么这么火？',
      avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=shadcn',
    },
    author: { name: 'UI 设计师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ui' },
    title_html: 'Shadcn/UI 为什么这么火？',
    description_html: '从<strong>库</strong>到<strong>组件源代码复制</strong>的思维转变。',
    content_html: '<p>极致的定制化自由度是核心竞争力。</p>',
    quality_level: 'normal',
    like_count: 55,
    comment_count: 9,
    word_count: 450,
    source_url: 'https://ui.shadcn.com',
  },
  {
    id: '24',
    source: {
      platform: 'community',
      title: 'Docker 进阶：容器安全扫描',
      avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=docker',
    },
    author: { name: '运维专家', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ops' },
    title_html: 'Docker 进阶：容器安全扫描',
    description_html: '保护你的镜像免受漏洞攻击的实战指南。',
    content_html: '<p>扫描、修复、加固：三位一体的安全观。</p>',
    quality_level: 'normal',
    like_count: 28,
    comment_count: 3,
    word_count: 1300,
    source_url: 'https://docker.com',
  },
  {
    id: '25',
    source: {
      platform: 'community',
      title: 'PostgreSQL vs MongoDB',
      avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=db',
    },
    author: { name: 'DBA小白', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dba' },
    title_html: 'PostgreSQL vs MongoDB：2026 年该选谁？',
    description_html: '关系型与非关系型的界限正在模糊。',
    content_html: '<p>PG 的 JSONB 与 Mongo 的查询优化对比。</p>',
    quality_level: 'normal',
    like_count: 73,
    comment_count: 18,
    word_count: 1800,
    source_url: 'https://mongodb.com',
  },
  {
    id: '26',
    source: {
      platform: 'community',
      title: 'AI 时代的 Prompt Engineering',
      avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=ai',
    },
    author: {
      name: '提示词黑客',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=prompt',
    },
    title_html: 'AI 时代的 Prompt Engineering 已死？',
    description_html: '当模型越来越聪明，我们还需要技巧吗？',
    content_html: '<p>核心在于思维拆解，而非咒语编排。</p>',
    quality_level: 'featured',
    like_count: 210,
    comment_count: 45,
    word_count: 900,
    source_url: 'https://openai.com',
  },
  {
    id: '27',
    source: {
      platform: 'community',
      title: '微服务还是单体？',
      avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=arch',
    },
    author: {
      name: '架构思考者',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=thinker',
    },
    title_html: '微服务还是单体？回归理性后的选择',
    description_html: '为什么越来越多的团队开始拥抱 <strong>Modular Monolith</strong>。',
    content_html: '<p>降低运维成本，提升开发体验。</p>',
    quality_level: 'normal',
    like_count: 62,
    comment_count: 11,
    word_count: 2200,
    source_url: 'https://martinfowler.com',
  },
  {
    id: '28',
    source: {
      platform: 'community',
      title: 'TypeScript 5.8 新功能',
      avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=ts',
    },
    author: {
      name: '类型体操员',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ts-dev',
    },
    title_html: 'TypeScript 5.8 新功能：性能优化到极致',
    description_html: '更快的编译速度和更精准的类型推断。',
    content_html: '<p>类型系统的进化从未停止。</p>',
    quality_level: 'normal',
    like_count: 39,
    comment_count: 5,
    word_count: 750,
    source_url: 'https://typescriptlang.org',
  },
  {
    id: '29',
    source: {
      platform: 'community',
      title: '远程办公三年感悟',
      avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=remote',
    },
    author: { name: '数字游民', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nomad' },
    title_html: '远程办公三年感悟：孤独与自由的博弈',
    description_html: '如何在远程环境下保持高效率和心理健康。',
    content_html: '<p>建立边界感是远程生存的第一准则。</p>',
    quality_level: 'normal',
    like_count: 88,
    comment_count: 32,
    word_count: 1400,
    source_url: 'https://remote.com',
  },
  {
    id: '30',
    source: {
      platform: 'community',
      title: 'Go 1.28 并发原语升级',
      avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=go',
    },
    author: { name: 'Gopher', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=gopher' },
    title_html: 'Go 1.28 并发原语升级',
    description_html: '标准库新增高效调度工具，降低锁竞争。',
    content_html: '<p>Go 依然是后端高并发的王者。</p>',
    quality_level: 'normal',
    like_count: 47,
    comment_count: 7,
    word_count: 1050,
    source_url: 'https://go.dev',
  },
  {
    id: '31',
    source: {
      platform: 'community',
      title: '全栈开发者的 2026 技术栈',
      avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=stack',
    },
    author: {
      name: '码农老张',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=laozhang',
    },
    title_html: '全栈开发者的 2026 技术栈清单',
    description_html: '从 Next.js 到 PostgreSQL，你的技能包更新了吗？',
    content_html: '<p>全栈不是全能，而是全链路解决问题的能力。</p>',
    quality_level: 'featured',
    like_count: 198,
    comment_count: 38,
    word_count: 2500,
    source_url: 'https://dev.to',
  },
  {
    id: '32',
    source: {
      platform: 'community',
      title: 'CSS 容器查询实战',
      avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=css',
    },
    author: { name: '切图仔', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=css-fan' },
    title_html: 'CSS 容器查询实战：再见，媒体查询',
    description_html: '根据父元素大小而非屏幕宽度来设计组件。',
    content_html: '<p>真正的组件化响应式设计已经到来。</p>',
    quality_level: 'normal',
    like_count: 41,
    comment_count: 6,
    word_count: 880,
    source_url: 'https://w3.org',
  },
  {
    id: '33',
    source: {
      platform: 'community',
      title: '2026 游戏开发趋势',
      avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=game',
    },
    author: {
      name: '独立开发者',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=game-dev',
    },
    title_html: '2026 独立游戏开发：虚幻 6 的冲击',
    description_html: '当照片级画质不再是门槛，核心竞争力在哪里？',
    content_html: '<p>叙事与玩法的深度决定了游戏的寿命。</p>',
    quality_level: 'normal',
    like_count: 124,
    comment_count: 29,
    word_count: 1600,
    source_url: 'https://unrealengine.com',
  },
]);

async function seedStrollRecommend() {
  const client = await clientPromise;
  const db = client.db(DATABASE_NAME);
  const collection = db.collection(COLLECTION_NAME);

  await collection.createIndex({ id: 1 }, { unique: true });

  const operations = recommendSeedData.map((item) => ({
    updateOne: {
      filter: { id: item.id },
      update: {
        $set: item,
      },
      upsert: true,
    },
  }));

  const result = await collection.bulkWrite(operations, { ordered: false });

  console.log(
    `[stroll-recommend] seeded ${recommendSeedData.length} docs into ${DATABASE_NAME}.${COLLECTION_NAME}`,
  );
  console.log(
    `[stroll-recommend] inserted=${result.upsertedCount}, modified=${result.modifiedCount}, matched=${result.matchedCount}`,
  );
}

seedStrollRecommend()
  .catch((error) => {
    console.error('[stroll-recommend] seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    const client = await clientPromise;
    await client.close();
  });
