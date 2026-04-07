import { JSONContent } from '@tiptap/react';

export type HAEditorOutlineItem = {
  id: string;
  text: string;
  level: number;
};

export const DEFAULT_CONTENT = `
  <h1>文档标题</h1>
  <h2>标题1</h2>
  <p></p>
`;

export const MAX_TITLE_LENGTH = 30;

export const getSaveStatusText = (date = new Date()) => {
  const time = [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');

  return `已保存 ${time}`;
};

export const createHeadingId = (text: string, index: number) => {
  const normalized = text
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || `heading-${index + 1}`;
};

export const getOutlineFromHtml = (html: string): HAEditorOutlineItem[] => {
  const headingRegex = /<h([1-6])(?:[^>]*)>(.*?)<\/h\1>/gi;
  return Array.from(html.matchAll(headingRegex)).map((match, index) => ({
    id: createHeadingId(match[2].replace(/<[^>]+>/g, ''), index),
    text: match[2].replace(/<[^>]+>/g, '').trim(),
    level: Number(match[1]),
  }));
};

export const injectHeadingIds = (html: string) => {
  let headingIndex = 0;
  return html.replace(/<h([1-6])(?![^>]*\sid=)([^>]*)>(.*?)<\/h\1>/gi, (_, level, attrs, inner) => {
    const plainText = String(inner)
      .replace(/<[^>]+>/g, '')
      .trim();
    const id = createHeadingId(plainText, headingIndex);
    headingIndex += 1;
    return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
  });
};

export const getOutlineFromEditor = (
  json: JSONContent | null | undefined
): HAEditorOutlineItem[] => {
  const items: HAEditorOutlineItem[] = [];

  const visit = (node: JSONContent | undefined) => {
    if (!node) return;

    if (node.type === 'heading') {
      const text =
        node.content
          ?.map((item) => item.text || '')
          .join('')
          .trim() || '未命名标题';
      const level = Number(node.attrs?.level || 1);
      items.push({
        id: createHeadingId(text, items.length),
        text,
        level,
      });
    }

    node.content?.forEach((child) => visit(child));
  };

  visit(json || undefined);
  return items;
};
