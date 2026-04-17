function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function inlineMdToHtml(text: string): string {
  // Protect code first
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Bold
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic (not inside **)
  text = text.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');
  // Strikethrough
  text = text.replace(/~~(.+?)~~/g, '<s>$1</s>');
  // Image before link
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
  // Link
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return text;
}

function mdxComponentToEditorHtml(mdx: string): string {
  const s = mdx.trim();

  const noteM = s.match(/^<Note\s+([^>]+?)>([\s\S]*?)<\/Note>$/);
  if (noteM) {
    const attrsStr = noteM[1];
    const content = noteM[2].trim();
    const typeM = attrsStr.match(/type=["']([^"']+)["']/);
    const titleM = attrsStr.match(/title=["']([^"']+)["']/);
    const noteType = typeM ? typeM[1] : 'info';
    const noteTitle = escapeHtml(titleM ? titleM[1] : '');
    const contentHtml = markdownToEditorHtml(content);
    return `<div data-node="note" data-type="${noteType}" data-title="${noteTitle}"><div class="note-node-content">${contentHtml}</div></div>`;
  }

  const linkM = s.match(/^<LinkCard\s+url=["']([^"']+)["']/);
  if (linkM) {
    const url = escapeHtml(linkM[1]);
    return `<div data-node="link-card" data-url="${url}"></div>`;
  }

  const detailsM = s.match(/^<Details\s+summary=["']([^"']+)["']>([\s\S]*?)<\/Details>$/);
  if (detailsM) {
    const summary = escapeHtml(detailsM[1]);
    const content = detailsM[2].trim();
    const contentHtml = markdownToEditorHtml(content);
    return `<div data-node="details" data-summary="${summary}"><div class="details-node-content">${contentHtml}</div></div>`;
  }

  // Other MDX components → preserve as code block
  return `<pre><code>${escapeHtml(s)}</code></pre>`;
}

export function markdownToEditorHtml(md: string): string {
  md = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Protect multi-line MDX components with placeholders
  const placeholders = new Map<string, string>();
  let counter = 0;
  const store = (m: string): string => {
    const key = `\x00MDX${counter++}\x00`;
    placeholders.set(key, m);
    return key;
  };

  md = md.replace(/<Note\s[^>]*?>[\s\S]*?<\/Note>/g, (m) => store(m));
  md = md.replace(/<Details\s[^>]*?>[\s\S]*?<\/Details>/g, (m) => store(m));
  md = md.replace(/<RakutenAffiliate\s[^/]*\/?>/g, (m) => store(m));

  const rawBlocks = md.trim().split(/\n{2,}/);
  const htmlParts: string[] = [];

  for (const rawBlock of rawBlocks) {
    const block = rawBlock.trim();
    if (!block) continue;

    // Placeholder → restore and convert
    if (placeholders.has(block)) {
      htmlParts.push(mdxComponentToEditorHtml(placeholders.get(block)!));
      continue;
    }

    // Code block
    const cbM = block.match(/^```(\w*)\n?([\s\S]*?)```$/);
    if (cbM) {
      const lang = cbM[1];
      const code = escapeHtml(cbM[2].replace(/\n+$/, ''));
      const langCls = lang ? ` class="language-${lang}"` : '';
      htmlParts.push(`<pre><code${langCls}>${code}</code></pre>`);
      continue;
    }

    // Heading
    const hm = block.match(/^(#{1,6})\s+(.+)$/);
    if (hm) {
      const level = hm[1].length;
      htmlParts.push(`<h${level}>${inlineMdToHtml(hm[2])}</h${level}>`);
      continue;
    }

    // HR
    if (/^[-*_]{3,}$/.test(block.trim())) {
      htmlParts.push('<hr>');
      continue;
    }

    const lines = block.split('\n');

    // Unordered list
    if (lines.filter((l) => l.trim()).every((l) => /^[-*+]\s/.test(l.trim()))) {
      const items = lines
        .filter((l) => l.trim())
        .map((l) => `<li>${inlineMdToHtml(l.trim().replace(/^[-*+]\s/, ''))}</li>`)
        .join('');
      htmlParts.push(`<ul>${items}</ul>`);
      continue;
    }

    // Ordered list
    if (lines.filter((l) => l.trim()).every((l) => /^\d+\.\s/.test(l.trim()))) {
      const items = lines
        .filter((l) => l.trim())
        .map((l) => `<li>${inlineMdToHtml(l.trim().replace(/^\d+\.\s/, ''))}</li>`)
        .join('');
      htmlParts.push(`<ol>${items}</ol>`);
      continue;
    }

    // Blockquote
    if (lines.every((l) => /^>\s?/.test(l) || l.trim() === '')) {
      const inner = lines.map((l) => inlineMdToHtml(l.replace(/^>\s?/, ''))).join('<br>');
      htmlParts.push(`<blockquote><p>${inner}</p></blockquote>`);
      continue;
    }

    // Single-line MDX component
    if (/^<[A-Z][a-zA-Z]*[\s/>]/.test(block.trim())) {
      htmlParts.push(mdxComponentToEditorHtml(block.trim()));
      continue;
    }

    // export const ... → preserve as code
    if (block.trim().startsWith('export ')) {
      htmlParts.push(`<pre><code>${escapeHtml(block.trim())}</code></pre>`);
      continue;
    }

    // Default paragraph
    const converted = lines.map((l) => inlineMdToHtml(l)).join('<br>');
    htmlParts.push(`<p>${converted}</p>`);
  }

  return htmlParts.join('\n');
}
