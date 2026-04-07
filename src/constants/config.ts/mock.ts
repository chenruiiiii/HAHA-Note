import { PublicNoteDetail } from '../../types/public-note';

export const publicNoteMockMap: Record<string, PublicNoteDetail> = {
  '1': {
    id: '1',
    title: '语雀专业会员支持试用MCP',
    titleHtml: '语雀专业会员支持试用MCP',
    summary:
      '语雀 API Token 功能现已向专业会员开放！之前只有超级会员才能使用的 Token 功能，现在专业会员也可以体验了。',
    summaryHtml:
      '语雀 API Token 功能现已向<strong>专业会员</strong>开放！ 之前只有<strong>超级会员</strong>才能使用的 Token 功能，现在专业会员也可以体验了。',
    sourceName: '语雀专业会员支持试用MCP',
    sourceTag: '语雀精选',
    authorName: '语雀官方',
    contentHtml: `
      <h2 id="usage">使用方式</h2>
      <p>专业会员可以在语雀设置页面获取 API Token，用于连接各种 AI 工具和第三方应用。</p>
      <ul>
        <li><strong>获取地址：</strong><a href="https://www.yuque.com/haha-note/api-token" target="_blank" rel="noreferrer">语雀 Token 设置页面</a></li>
        <li><strong>试用额度：</strong>每天 50 次 API 调用</li>
      </ul>
      <h2 id="scenes">应用场景</h2>
      <p>有了 Token，你可以：</p>
      <ol>
        <li><strong>连接 AI 助手</strong> - 让 Claude、ChatGPT 等 AI 工具直接读取你的语雀知识库，实现智能问答和知识检索</li>
        <li><strong>自动化工作流</strong> - 通过 MCP 协议接入各种自动化工具</li>
        <li><strong>知识库管理</strong> - 批量操作文档、自动整理分类</li>
        <li><strong>第三方集成</strong> - 与 Obsidian、Notion 等工具进行数据同步</li>
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
    likeCount: 56,
    commentCount: 13,
    wordCount: 389,
    updatedAt: '2026-04-07',
    docUrl: 'https://www.yuque.com/haha-note/api-token',
  },
};

export const defaultPublicNoteId = '1';
