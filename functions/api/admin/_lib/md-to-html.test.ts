import { describe, it, expect } from 'vitest';
import { markdownToEditorHtml } from './md-to-html';

describe('markdownToEditorHtml - headings', () => {
  it('converts h1-h6', () => {
    expect(markdownToEditorHtml('# a')).toBe('<h1>a</h1>');
    expect(markdownToEditorHtml('### c')).toBe('<h3>c</h3>');
  });
});

describe('markdownToEditorHtml - paragraphs & inline', () => {
  it('wraps paragraph', () => {
    expect(markdownToEditorHtml('hello')).toBe('<p>hello</p>');
  });

  it('converts bold', () => {
    expect(markdownToEditorHtml('**a**')).toBe('<p><strong>a</strong></p>');
  });

  it('converts italic', () => {
    expect(markdownToEditorHtml('*a*')).toBe('<p><em>a</em></p>');
  });

  it('converts strikethrough', () => {
    expect(markdownToEditorHtml('~~a~~')).toBe('<p><s>a</s></p>');
  });

  it('converts code', () => {
    expect(markdownToEditorHtml('`x`')).toBe('<p><code>x</code></p>');
  });

  it('converts link', () => {
    expect(markdownToEditorHtml('[t](https://x.y)')).toBe('<p><a href="https://x.y">t</a></p>');
  });

  it('converts image before link', () => {
    expect(markdownToEditorHtml('![A](/x.png)')).toBe('<p><img src="/x.png" alt="A"></p>');
  });
});

describe('markdownToEditorHtml - blocks', () => {
  it('converts ul', () => {
    expect(markdownToEditorHtml('- a\n- b')).toBe('<ul><li>a</li><li>b</li></ul>');
  });

  it('converts ol', () => {
    expect(markdownToEditorHtml('1. a\n2. b')).toBe('<ol><li>a</li><li>b</li></ol>');
  });

  it('converts hr', () => {
    expect(markdownToEditorHtml('---')).toBe('<hr>');
  });

  it('converts blockquote', () => {
    expect(markdownToEditorHtml('> a\n> b')).toBe('<blockquote><p>a<br>b</p></blockquote>');
  });

  it('converts code block with language', () => {
    const md = '```ts\nconst x = 1;\n```';
    expect(markdownToEditorHtml(md)).toBe('<pre><code class="language-ts">const x = 1;</code></pre>');
  });
});

describe('markdownToEditorHtml - MDX components', () => {
  it('converts Note', () => {
    const md = '<Note type="info" title="T">\nhello\n</Note>';
    expect(markdownToEditorHtml(md)).toBe(
      '<div data-node="note" data-type="info" data-title="T"><div class="note-node-content"><p>hello</p></div></div>'
    );
  });

  it('converts LinkCard', () => {
    const md = '<LinkCard url="https://x.y" />';
    expect(markdownToEditorHtml(md)).toBe('<div data-node="link-card" data-url="https://x.y"></div>');
  });

  it('converts Details', () => {
    const md = '<Details summary="S">\nhello\n</Details>';
    expect(markdownToEditorHtml(md)).toBe(
      '<div data-node="details" data-summary="S"><div class="details-node-content"><p>hello</p></div></div>'
    );
  });
});
