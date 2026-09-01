import { describe, it, expect, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { htmlToTipTapJson } from './content-html';

describe('htmlToTipTapJson', () => {
  it('消毒并转换段落', () => {
    const json = htmlToTipTapJson('<p>你好</p>');

    expect(json.type).toBe('doc');
    expect(json.content).toHaveLength(1);
    expect(json.content?.[0]?.type).toBe('paragraph');
  });

  it('中和 script 与 onerror 注入向量', () => {
    const json = htmlToTipTapJson(
      '<p onclick="alert(1)">安全</p><script>alert(2)</script><img src="x" onerror="alert(3)">'
    );

    // 序列化后不得包含脚本或事件处理器
    const serialized = JSON.stringify(json);
    expect(serialized).not.toContain('script');
    expect(serialized).not.toContain('onerror');
    expect(serialized).not.toContain('alert');
  });

  it('标题映射为 heading 节点并保留层级', () => {
    const json = htmlToTipTapJson('<h2>标题</h2>');

    expect(json.content?.[0]?.type).toBe('heading');
    expect(json.content?.[0]?.attrs).toEqual({ level: 2 });
  });

  it('空输入返回空文档而非崩溃', () => {
    const json = htmlToTipTapJson('');

    expect(json.type).toBe('doc');
    expect(Array.isArray(json.content)).toBe(true);
  });
});
