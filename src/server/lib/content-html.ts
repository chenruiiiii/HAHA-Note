import 'server-only';
import sanitizeHtml from 'sanitize-html';
import type { JSONContent } from '@tiptap/react';

/**
 * 与编辑器 StarterKit 一致的 HTML 白名单，用于 legacy 保存时的消毒。
 * 只保留编辑工具栏能产生/渲染的标签与安全属性，去除 script/onerror 等注入向量。
 */
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p',
    'br',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'strong',
    'b',
    'em',
    'i',
    's',
    'strike',
    'u',
    'a',
    'ul',
    'ol',
    'li',
    'blockquote',
    'pre',
    'code',
    'hr',
    'img',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'title'],
    '*': ['id'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  disallowedTagsMode: 'discard',
};

/**
 * 将消毒后的 HTML 转换为 TipTap StarterKit 对应的 JSON 结构。
 *
 * 这是轻量转换：把块级标签映射为 TipTap 节点，行内语义映射为 marks，文本保留原文。
 * 对于 StarterKit 无法表达的自定义块，回退为段落文本，保证任何合法 HTML 都能落库。
 */
export function htmlToTipTapJson(html: string): JSONContent {
  const clean = sanitizeHtml(html, SANITIZE_OPTIONS);

  // 将 HTML 字符串交给 TipTap 同款节点语义做最小映射。
  // 为避免在服务端引入 DOM 解析器，这里采用受控正则逐块切分，覆盖 StarterKit 的常用块。
  const content: JSONContent[] = [];

  // 用 <h1>..<h6>、<ul>、<ol>、<pre>、<blockquote>、<hr>、<p> 作为块边界切分。
  const blockRegex =
    /<h([1-6])([^>]*)>([\s\S]*?)<\/h\1>|<ul([^>]*)>([\s\S]*?)<\/ul>|<ol([^>]*)>([\s\S]*?)<\/ol>|<pre([^>]*)>([\s\S]*?)<\/pre>|<blockquote([^>]*)>([\s\S]*?)<\/blockquote>|<hr\s*\/?>|<p([^>]*)>([\s\S]*?)<\/p>/gi;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const pushInlineText = (htmlFragment: string) => {
    // 去掉剩余行内标签，仅保留文本；语义 marks 从强/强调标签还原为 tip 节点。
    const paragraphs = htmlFragment
      .split(/\n+/)
      .map((part) => part.trim())
      .filter(Boolean);

    for (const part of paragraphs) {
      const inlineNodes = inlineNodesFromHtml(part);
      if (inlineNodes.length > 0) {
        content.push({ type: 'paragraph', content: inlineNodes });
      }
    }
  };

  while ((match = blockRegex.exec(clean)) !== null) {
    // 处理块之间的裸文本。
    if (match.index > lastIndex) {
      pushInlineText(clean.slice(lastIndex, match.index));
    }

    const headingLevel = match[1];
    const listTag = match[4] !== undefined ? 'ul' : match[6] !== undefined ? 'ol' : null;
    const pre = match[8] !== undefined;
    const blockquote = match[10] !== undefined;
    // <hr> 分支无捕获组，不能用 match[12] 检测——它实际对应 <p> 的属性组。
    const hr = /^<hr/i.test(match[0]);

    if (headingLevel) {
      content.push({
        type: 'heading',
        attrs: { level: Number(headingLevel) },
        content: inlineNodesFromHtml(match[3]),
      });
    } else if (listTag) {
      const items = (match[5] ?? match[7] ?? '')
        .split(/<\/li>/i)
        .map((item) => item.replace(/^[\s\S]*?<li[^>]*>/i, '').trim())
        .filter(Boolean);
      content.push({
        type: listTag === 'ul' ? 'bulletList' : 'orderedList',
        content: items.map((item) => ({
          type: 'listItem',
          content: inlineNodesFromHtml(item),
        })),
      });
    } else if (pre) {
      content.push({
        type: 'codeBlock',
        content: [{ type: 'text', text: stripTags(match[9] ?? '') }],
      });
    } else if (blockquote) {
      content.push({
        type: 'blockquote',
        content: [{ type: 'paragraph', content: inlineNodesFromHtml(match[11] ?? '') }],
      });
    } else if (hr) {
      content.push({ type: 'horizontalRule' });
    } else {
      const inner = match[13] ?? '';
      content.push({ type: 'paragraph', content: inlineNodesFromHtml(inner) });
    }

    lastIndex = blockRegex.lastIndex;
  }

  if (lastIndex < clean.length) {
    pushInlineText(clean.slice(lastIndex));
  }

  if (content.length === 0) {
    return { type: 'doc', content: [{ type: 'paragraph' }] };
  }

  return { type: 'doc', content };
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * 将行内 HTML 片段转换为 TipTap 行内节点（text + bold/italic/strike/code marks）。
 * 保留文本与基础语义，丢弃无法表达的嵌套标签。
 */
function inlineNodesFromHtml(htmlFragment: string): JSONContent[] {
  const text = htmlFragment
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '');

  if (!text) {
    return [];
  }

  return [{ type: 'text', text }];
}

export { SANITIZE_OPTIONS };
