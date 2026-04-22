import { describe, it, expect } from 'vitest';
import { htmlToMarkdown } from './html-to-md';

describe('htmlToMarkdown - block elements', () => {
  it('converts paragraphs', () => {
    expect(htmlToMarkdown('<p>hello</p>')).toBe('hello');
  });

  it('converts h1-h6', () => {
    expect(htmlToMarkdown('<h1>A</h1>')).toBe('# A');
    expect(htmlToMarkdown('<h3>B</h3>')).toBe('### B');
  });

  it('converts ul to dash list', () => {
    expect(htmlToMarkdown('<ul><li>a</li><li>b</li></ul>')).toBe('- a\n- b');
  });

  it('converts ol to numbered list', () => {
    expect(htmlToMarkdown('<ol><li>a</li><li>b</li></ol>')).toBe('1. a\n2. b');
  });

  it('converts blockquote with line prefix', () => {
    expect(htmlToMarkdown('<blockquote>a\nb</blockquote>')).toBe('> a\n> b');
  });

  it('converts pre code with language class', () => {
    const html = '<pre><code class="language-ts">const x = 1;</code></pre>';
    expect(htmlToMarkdown(html)).toBe('```ts\nconst x = 1;\n```');
  });

  it('converts hr', () => {
    expect(htmlToMarkdown('<p>a</p><hr><p>b</p>')).toBe('a\n\n---\n\nb');
  });
});

describe('htmlToMarkdown - inline elements', () => {
  it('converts strong to **', () => {
    expect(htmlToMarkdown('<p><strong>a</strong></p>')).toBe('**a**');
  });

  it('uses <strong> tag when bracket is inside (Japanese quotes)', () => {
    expect(htmlToMarkdown('<p><strong>「a」</strong></p>')).toBe('<strong>「a」</strong>');
  });

  it('uses <strong> tag when parens inside', () => {
    expect(htmlToMarkdown('<p><strong>Nutanix(AHV)</strong></p>')).toBe('<strong>Nutanix(AHV)</strong>');
  });

  it('converts em to *', () => {
    expect(htmlToMarkdown('<p><em>a</em></p>')).toBe('*a*');
  });

  it('preserves u tag', () => {
    expect(htmlToMarkdown('<p><u>a</u></p>')).toBe('<u>a</u>');
  });

  it('converts s to ~~', () => {
    expect(htmlToMarkdown('<p><s>a</s></p>')).toBe('~~a~~');
  });

  it('converts inline code', () => {
    expect(htmlToMarkdown('<p><code>x</code></p>')).toBe('`x`');
  });

  it('converts anchor', () => {
    expect(htmlToMarkdown('<p><a href="https://x.y">t</a></p>')).toBe('[t](https://x.y)');
  });

  it('converts img', () => {
    expect(htmlToMarkdown('<p><img src="/a.png" alt="A"></p>')).toBe('![A](/a.png)');
  });
});

describe('htmlToMarkdown - span styling', () => {
  it('converts span color to <span style>', () => {
    const input = '<p><span style="color: #ff0000">red</span></p>';
    expect(htmlToMarkdown(input)).toBe('<span style="color:#ff0000">red</span>');
  });

  it('converts rgb() to hex in color', () => {
    const input = '<p><span style="color: rgb(255, 0, 0)">red</span></p>';
    expect(htmlToMarkdown(input)).toBe('<span style="color:#ff0000">red</span>');
  });

  it('converts background-color to <mark>', () => {
    const input = '<p><span style="background-color: #ffcc00">y</span></p>';
    expect(htmlToMarkdown(input)).toBe('<mark style="background-color:#ffcc00">y</mark>');
  });

  it('preserves mark tag with background-color', () => {
    const input = '<p><mark style="background-color: #ffcc00">y</mark></p>';
    expect(htmlToMarkdown(input)).toBe('<mark style="background-color:#ffcc00">y</mark>');
  });
});

describe('htmlToMarkdown - MDX custom nodes', () => {
  it('converts Note node', () => {
    const html = '<div data-node="note" data-type="info" data-title="T"><div class="note-node-content"><p>hello</p></div></div>';
    expect(htmlToMarkdown(html)).toBe('<Note type="info" title="T">\nhello\n</Note>');
  });

  it('converts Note without title', () => {
    const html = '<div data-node="note" data-type="warn"><div class="note-node-content"><p>x</p></div></div>';
    expect(htmlToMarkdown(html)).toBe('<Note type="warn">\nx\n</Note>');
  });

  it('converts LinkCard self-closing', () => {
    const html = '<div data-node="link-card" data-url="https://x.y"></div>';
    expect(htmlToMarkdown(html)).toBe('<LinkCard url="https://x.y" />');
  });

  it('converts Details with summary', () => {
    const html = '<div data-node="details" data-summary="S"><div class="details-node-content"><p>x</p></div></div>';
    expect(htmlToMarkdown(html)).toBe('<Details summary="S">\nx\n</Details>');
  });
});

describe('htmlToMarkdown - edge cases', () => {
  it('collapses 3+ blank lines', () => {
    expect(htmlToMarkdown('<p>a</p><p></p><p></p><p>b</p>')).toBe('a\n\nb');
  });

  it('trims trailing whitespace', () => {
    expect(htmlToMarkdown('<p>a</p>  ')).toBe('a');
  });
});
