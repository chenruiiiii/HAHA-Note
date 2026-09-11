import { describe, it, expect } from 'vitest';
import { convertDocumentHtml, emptyTiptapDoc, sha256, type TiptapDoc } from '@/lib/content';

function nodeByType(doc: TiptapDoc, type: string) {
  return doc.content.find((n) => n.type === type);
}

function firstText(doc: TiptapDoc) {
  return doc.content[0];
}

describe('convertDocumentHtml', () => {
  it('maps inline marks to TipTap marks (strong/em/u/s/code/a)', () => {
    const html =
      '<p><strong>b</strong> <em>i</em> <u>u</u> <s>s</s> <code>c</code> <a href="https://x.dev">link</a></p>';
    const { json } = convertDocumentHtml(html);
    const p = nodeByType(json, 'paragraph')!;
    const textNodes = p.content!.filter(
      (n) => n.type === 'text' && typeof n.text === 'string' && n.text.trim() !== ''
    );
    expect(textNodes[0].marks).toEqual([{ type: 'bold' }]);
    expect(textNodes[1].marks).toEqual([{ type: 'italic' }]);
    expect(textNodes[2].marks).toEqual([{ type: 'underline' }]);
    expect(textNodes[3].marks).toEqual([{ type: 'strike' }]);
    expect(textNodes[4].marks).toEqual([{ type: 'code' }]);
    expect(textNodes[5].marks).toEqual([{ type: 'link', attrs: { href: 'https://x.dev' } }]);
  });

  it('keeps a text node free of marks when no inline tag wraps it', () => {
    const { json } = convertDocumentHtml('<p>plain</p>');
    const text = firstText(json).content![0];
    expect(text.marks).toBeUndefined();
  });

  it('never nests a block inside a paragraph and wraps stray text under doc', () => {
    const { json } = convertDocumentHtml('<ul><li>a</li></ul>text');
    const list = nodeByType(json, 'bulletList')!;
    expect(list).toBeDefined();
    // 游离文本被包成独立 paragraph，而不是挂在 list 里
    const tail = json.content[json.content.length - 1];
    expect(tail.type).toBe('paragraph');
  });

  it('drops javascript: links through sanitize-html', () => {
    const { html } = convertDocumentHtml('<p><a href="javascript:alert(1)">x</a></p>');
    expect(html).not.toContain('javascript:');
  });

  it('handles empty and nullish input as an empty paragraph doc', () => {
    const result = convertDocumentHtml(null);
    expect(result.ok).toBe(true);
    expect(result.json.type).toBe('doc');
    expect(result.html).toBe('');
  });

  it('produces fingerprints (sha256) for input and output', () => {
    const result = convertDocumentHtml('<p>hello</p>');
    expect(result.inputSha256).toBe(sha256('<p>hello</p>'));
    expect(result.outputSha256).toHaveLength(64);
  });

  it('fails closed when conversion throws and returns empty doc', () => {
    const result = convertDocumentHtml('<p>ok</p>');
    expect(result.ok).toBe(true);
    expect(result.reason).toBeUndefined();
    expect(emptyTiptapDoc().type).toBe('doc');
  });
});
