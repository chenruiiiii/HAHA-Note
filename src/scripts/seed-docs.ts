import clientPromise from '@/lib/mongodb';
import { DocumentDetail, DocumentDetailSchema } from '@/models/docs';

const DB_NAME = 'repository'; // 新数据库名称
const DOCS_COLLECTION = 'docs_detail';

export async function seedDocuments() {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<DocumentDetail>(DOCS_COLLECTION);

  const documents = DocumentDetailSchema.array().parse([
    {
      _id: 'D_m8n2v1x9y0',
      repository_id: 'R_v92kLp10',
      title: '第一章：从 jQuery 到 React',
      content_html: `
        <h1>从命令式到声明式</h1>
        <p>jQuery 时代，我们更习惯直接操作 DOM，哪里变了就改哪里。</p>
        <p>React 把界面描述为状态的映射，代码组织方式也随之改变。</p>
        <h2>为什么 React 会胜出</h2>
        <p>组件化让复用边界更清晰，单向数据流让问题更容易定位。</p>
        <h2>迁移时最容易忽略的点</h2>
        <p>不是 API 替换，而是思维模型从“操作页面”切换到“声明页面”。</p>
      `,
      author: '张三',
      updated_at: '2026-04-16 10:18',
    },
    {
      _id: 'D_p5r3t1z8w4',
      repository_id: 'R_v92kLp10',
      title: '第二章：微前端架构实践',
      content_html: `
        <h1>微前端到底解决什么问题</h1>
        <p>它不是为了追求技术新鲜感，而是为了解决大型团队并行开发和独立发布的问题。</p>
        <h2>适合引入的场景</h2>
        <p>多个业务域边界清晰，团队独立维护，发布节奏差异明显。</p>
        <h2>不适合的场景</h2>
        <p>单体应用规模还不大时，强行拆分只会提高通信和部署成本。</p>
        <h2>落地建议</h2>
        <p>优先统一路由协议、鉴权和设计系统，再考虑子应用接入方式。</p>
      `,
      author: '张三',
      updated_at: '2026-04-17 14:32',
    },
    {
      _id: 'D_q1w2e3r4t5',
      repository_id: 'R_a7s8d9f0',
      title: '色彩系统设计指南',
      content_html: `
        <h1>建立语义化色彩系统</h1>
        <p>颜色不应该只用“红色、蓝色”命名，而应该关联到“成功、警告、品牌”这类语义。</p>
        <h2>基础色与语义色</h2>
        <p>基础色负责设计表达，语义色负责业务含义，二者之间建立映射关系。</p>
        <h2>深浅阶梯</h2>
        <p>每一种主色建议至少准备 5 到 10 个层级，以覆盖背景、边框、文字和强调态。</p>
        <h2>落地方式</h2>
        <p>在代码里优先沉淀设计 token，而不是把具体色值写进组件。</p>
      `,
      author: '李思',
      updated_at: '2026-04-18 09:06',
    },
  ]);

  const ops = documents.map((doc) => ({
    updateOne: { filter: { _id: doc._id }, update: { $set: doc }, upsert: true },
  }));

  const result = await collection.bulkWrite(ops);
  console.log(
    `✅ ${DOCS_COLLECTION}文档详情同步成功：插入 ${result.upsertedCount} 条，更新 ${result.modifiedCount} 条`
  );
  process.exit(0);
}

// seedDocuments().catch(console.error);
