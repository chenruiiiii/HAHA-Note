import sanitizeHtml from 'sanitize-html';
import { Parser } from 'htmlparser2';
import { createHash } from 'node:crypto';

export interface TiptapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  marks?: TiptapMark[];
}

export interface TiptapDoc extends TiptapNode {
  type: 'doc';
  content: TiptapNode[];
}

export interface ConversionResult {
  html: string;
  json: TiptapDoc;
  text: string;
  inputSha256: string;
  outputSha256: string;
  ok: boolean;
  reason?: string;
}

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p',
    'br',
    'hr',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'blockquote',
    'ul',
    'ol',
    'li',
    'pre',
    'code',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'del',
    'a',
    'img',
    'span',
    'div',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
};

// 节点归属与编辑器 StarterKit v3 扩展集保持一致（Link/Underline 默认包含）。
const INLINE_MARK_TAGS: Record<string, TiptapMark> = {
  strong: { type: 'bold' },
  b: { type: 'bold' },
  em: { type: 'italic' },
  i: { type: 'italic' },
  u: { type: 'underline' },
  s: { type: 'strike' },
  del: { type: 'strike' },
  code: { type: 'code' },
};

const BLOCK_TAGS = new Set([
  'p',
  'div',
  'span',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'ul',
  'ol',
  'li',
  'pre',
]);

// 这些容器只接受块级子节点，落文本前需要隐式包一层 paragraph / listItem。
const BLOCK_CONTAINERS = new Set(['doc', 'blockquote']);
const LIST_CONTAINERS = new Set(['bulletList', 'orderedList']);

export function emptyTiptapDoc(): TiptapDoc {
  return { type: 'doc', content: [{ type: 'paragraph' }] };
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function htmlToPlainText(html: string): string {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, ' ').trim();
}

interface StackEntry {
  // null 表示隐式创建的节点（如自动包裹的 paragraph），不与任何闭合标签配对
  name: string | null;
  node: TiptapNode;
}

function blockNodeFor(name: string): TiptapNode | null {
  if (name === 'p' || name === 'div' || name === 'span') {
    return { type: 'paragraph', content: [] };
  }
  if (/^h[1-6]$/.test(name)) {
    const level = Number(name[1]);
    return { type: 'heading', attrs: { level }, content: [] };
  }
  if (name === 'blockquote') {
    return { type: 'blockquote', content: [] };
  }
  if (name === 'ul') {
    return { type: 'bulletList', content: [] };
  }
  if (name === 'ol') {
    return { type: 'orderedList', content: [] };
  }
  if (name === 'li') {
    return {
      type: 'listItem',
      content: [{ type: 'paragraph', content: [] }],
    };
  }
  if (name === 'pre') {
    return { type: 'codeBlock', content: [] };
  }
  return null;
}

export function htmlToTiptapDoc(html: string): TiptapDoc {
  const root: TiptapDoc = { type: 'doc', content: [] };
  const stack: StackEntry[] = [{ name: null, node: root }];
  // null 占位：内联标签存在但没有可用的 mark（如无 href 的 <a>），闭合时仍需对称弹出
  const markStack: Array<TiptapMark | null> = [];

  const current = () => stack[stack.length - 1].node;

  const pushNode = (node: TiptapNode) => {
    const parent = current();
    parent.content = parent.content ?? [];
    parent.content.push(node);
  };

  const pushStack = (name: string | null, node: TiptapNode) => {
    pushNode(node);
    stack.push({ name, node });
  };

  // 块级标签开启前，先结束悬挂中的 paragraph（模拟浏览器对 <p><ul> 的处理），
  // 保证块节点永远不会嵌进 paragraph。
  const closePendingParagraph = () => {
    while (
      stack.length > 1 &&
      current().type === 'paragraph' &&
      stack[stack.length - 1].name !== 'li'
    ) {
      stack.pop();
    }
  };

  // 让文本总是落在 paragraph 里：doc/blockquote 隐式包 paragraph，
  // 列表隐式包 listItem + paragraph。
  const ensureTextParent = () => {
    let guard = 0;
    while (guard++ < 4) {
      const type = current().type;
      if (type === 'paragraph' || type === 'codeBlock' || type === 'heading') {
        return;
      }
      if (type === 'listItem') {
        const paragraph = current().content?.[0];
        if (paragraph && paragraph.type === 'paragraph') {
          stack.push({ name: null, node: paragraph });
        } else {
          pushStack(null, { type: 'paragraph', content: [] });
        }
        return;
      }
      if (LIST_CONTAINERS.has(type)) {
        pushStack('li', { type: 'listItem', content: [{ type: 'paragraph', content: [] }] });
        const paragraph = current().content![0];
        stack.push({ name: null, node: paragraph });
        return;
      }
      if (BLOCK_CONTAINERS.has(type)) {
        pushStack(null, { type: 'paragraph', content: [] });
        return;
      }
      return;
    }
  };

  const parser = new Parser(
    {
      onopentag(name, attrs) {
        if (name === 'br') {
          ensureTextParent();
          pushNode({ type: 'hardBreak' });
          return;
        }

        if (name === 'hr') {
          closePendingParagraph();
          pushNode({ type: 'horizontalRule' });
          return;
        }

        if (name === 'img' && attrs.src) {
          ensureTextParent();
          pushNode({
            type: 'image',
            attrs: { src: attrs.src, alt: attrs.alt ?? null },
          });
          return;
        }

        const mark = INLINE_MARK_TAGS[name];
        if (name === 'a') {
          if (attrs.href && current().type !== 'codeBlock') {
            markStack.push({ type: 'link', attrs: { href: attrs.href } });
          } else {
            markStack.push(null);
          }
          return;
        }

        if (mark) {
          // codeBlock 内文本不携带 marks，保持 schema 合法；仍压入占位保证闭合对称
          markStack.push(current().type !== 'codeBlock' ? mark : null);
          return;
        }

        const node = blockNodeFor(name);
        if (node) {
          closePendingParagraph();
          if (name === 'li') {
            const listType = current().type;
            if (!LIST_CONTAINERS.has(listType)) {
              // 容错的 li：直接挂到隐式 bulletList 下
              pushStack(null, { type: 'bulletList', content: [] });
            }
            pushStack(name, node);
            stack.push({ name: null, node: node.content![0] });
          } else {
            pushStack(name, node);
          }
        }
      },
      ontext(text) {
        if (!text) {
          return;
        }

        ensureTextParent();
        const node: TiptapNode = { type: 'text', text };
        const marks = markStack.filter((mark): mark is TiptapMark => mark !== null);
        if (marks.length > 0 && current().type !== 'codeBlock') {
          node.marks = marks;
        }

        pushNode(node);
      },
      onclosetag(name) {
        if (name in INLINE_MARK_TAGS || name === 'a') {
          markStack.pop();
          return;
        }

        if (name === 'br' || name === 'hr' || name === 'img') {
          return;
        }

        if (BLOCK_TAGS.has(name)) {
          // 弹出到本次闭合的节点为止；未匹配（畸形 HTML）时不动栈
          for (let i = stack.length - 1; i >= 1; i--) {
            if (stack[i].name === name) {
              stack.length = i;
              return;
            }
          }
        }
      },
    },
    { decodeEntities: true }
  );

  parser.write(html);
  parser.end();

  if (!root.content.length) {
    return emptyTiptapDoc();
  }

  return root;
}

export function convertDocumentHtml(rawHtml: string | null | undefined): ConversionResult {
  const input = rawHtml ?? '';
  const inputSha256 = sha256(input);

  try {
    const html = sanitizeHtml(input, SANITIZE_OPTIONS);
    const json = htmlToTiptapDoc(html);
    const text = htmlToPlainText(html);
    const outputSha256 = sha256(JSON.stringify(json));
    const hadText = htmlToPlainText(input).length > 0;
    const ok = !hadText || text.length > 0;

    return {
      html,
      json,
      text,
      inputSha256,
      outputSha256,
      ok,
      reason: ok ? undefined : 'CONVERSION_EMPTY',
    };
  } catch (error) {
    return {
      html: '',
      json: emptyTiptapDoc(),
      text: '',
      inputSha256,
      outputSha256: sha256(''),
      ok: false,
      reason: error instanceof Error ? error.message : 'CONVERSION_FAILED',
    };
  }
}
