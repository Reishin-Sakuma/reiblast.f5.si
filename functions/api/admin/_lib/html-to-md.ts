import { parseHTML } from 'linkedom';

const TEXT_NODE = 3;
const ELEMENT_NODE = 1;

function rgbToHex(rgb: string): string {
  const m = rgb.trim().match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!m) return rgb;
  const hex = (n: string) => Number(n).toString(16).padStart(2, '0');
  return `#${hex(m[1])}${hex(m[2])}${hex(m[3])}`;
}

function hasBrackets(s: string): boolean {
  return /[「」『』（）()\[\]]/.test(s);
}

function childrenToMd(node: Node): string {
  let out = '';
  node.childNodes.forEach((c) => {
    out += convertNode(c);
  });
  return out;
}

function directChildren(node: Element, tag: string): Element[] {
  const out: Element[] = [];
  node.childNodes.forEach((c) => {
    if (c.nodeType === ELEMENT_NODE && (c as Element).tagName.toLowerCase() === tag) {
      out.push(c as Element);
    }
  });
  return out;
}

function styleLookup(style: string, prop: string): string | null {
  // case-insensitive property match; value can be rgb(), #hex, or named color
  const re = new RegExp(`(?:^|;|\\s)${prop}\\s*:\\s*(rgb\\([^)]+\\)|#[0-9a-fA-F]{3,8}|[a-zA-Z][a-zA-Z0-9-]*)`, 'i');
  const m = style.match(re);
  return m ? m[1] : null;
}

function convertNode(node: Node): string {
  if (node.nodeType === TEXT_NODE) {
    return node.textContent ?? '';
  }
  if (node.nodeType !== ELEMENT_NODE) return '';

  const el = node as Element;
  const tag = el.tagName.toLowerCase();

  switch (tag) {
    case 'p': {
      const content = childrenToMd(el);
      if (content.trim() === '') return '\n';
      return content + '\n\n';
    }
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      return '#'.repeat(Number(tag[1])) + ' ' + childrenToMd(el).trim() + '\n\n';

    case 'ul': {
      const items = directChildren(el, 'li').map((li) => '- ' + childrenToMd(li).trim());
      return items.join('\n') + '\n\n';
    }
    case 'ol': {
      const items = directChildren(el, 'li').map((li, i) => `${i + 1}. ` + childrenToMd(li).trim());
      return items.join('\n') + '\n\n';
    }
    case 'blockquote': {
      const content = childrenToMd(el).trim();
      return content.split('\n').map((l) => '> ' + l).join('\n') + '\n\n';
    }
    case 'pre': {
      const code = (el.querySelector('code') as Element | null) ?? el;
      const text = code.textContent ?? '';
      if (/^<[A-Z]/.test(text.trim())) {
        return text.trim() + '\n\n';
      }
      let lang = '';
      const classes = (code.getAttribute('class') ?? '').split(/\s+/);
      for (const cls of classes) {
        if (cls.startsWith('language-')) {
          lang = cls.slice(9);
          break;
        }
      }
      return '```' + lang + '\n' + text + '\n```\n\n';
    }
    case 'hr':
      return '\n---\n\n';

    case 'strong': {
      const content = childrenToMd(el);
      if (hasBrackets(content)) return `<strong>${content}</strong>`;
      return `**${content}**`;
    }
    case 'em':
      return `*${childrenToMd(el)}*`;
    case 'u':
      return `<u>${childrenToMd(el)}</u>`;
    case 's':
      return `~~${childrenToMd(el)}~~`;
    case 'code':
      return '`' + (el.textContent ?? '') + '`';
    case 'a': {
      const href = el.getAttribute('href') ?? '';
      return `[${childrenToMd(el)}](${href})`;
    }
    case 'img': {
      const src = el.getAttribute('src') ?? '';
      const alt = el.getAttribute('alt') ?? '';
      return `![${alt}](${src})`;
    }
    case 'br':
      return '\n';

    case 'mark': {
      const style = el.getAttribute('style') ?? '';
      const content = childrenToMd(el);
      const bg = styleLookup(style, 'background-color');
      if (bg) {
        const color = bg.startsWith('rgb') ? rgbToHex(bg) : bg;
        return `<mark style="background-color:${color}">${content}</mark>`;
      }
      return content;
    }

    case 'span': {
      const style = el.getAttribute('style') ?? '';
      let content = childrenToMd(el);
      const colorRaw = styleLookup(style, 'color');
      const bgRaw = styleLookup(style, 'background-color');
      if (bgRaw) {
        const c = bgRaw.startsWith('rgb') ? rgbToHex(bgRaw) : bgRaw;
        content = `<mark style="background-color:${c}">${content}</mark>`;
      }
      if (colorRaw) {
        const c = colorRaw.startsWith('rgb') ? rgbToHex(colorRaw) : colorRaw;
        content = `<span style="color:${c}">${content}</span>`;
      }
      return content;
    }

    case 'div':
    case 'body':
    case 'html':
    case 'section':
    case 'article': {
      const dataNode = el.getAttribute('data-node') ?? '';
      if (dataNode === 'note') {
        const noteType = el.getAttribute('data-type') ?? 'info';
        const noteTitle = el.getAttribute('data-title') ?? '';
        const contentEl =
          (el.querySelector('.note-node-content') as Element | null) ?? el;
        const innerContent = childrenToMd(contentEl).trim();
        const titleAttr = noteTitle ? ` title="${noteTitle}"` : '';
        return `<Note type="${noteType}"${titleAttr}>\n${innerContent}\n</Note>\n\n`;
      }
      if (dataNode === 'link-card') {
        const url = el.getAttribute('data-url') ?? '';
        return `<LinkCard url="${url}" />\n\n`;
      }
      if (dataNode === 'details') {
        const summary = el.getAttribute('data-summary') ?? '詳細を見る';
        const contentEl =
          (el.querySelector('.details-node-content') as Element | null) ?? el;
        const innerContent = childrenToMd(contentEl).trim();
        return `<Details summary="${summary}">\n${innerContent}\n</Details>\n\n`;
      }
      return childrenToMd(el);
    }

    default:
      // Unknown tag - keep as raw HTML (MDX components etc.)
      return el.outerHTML ?? '';
  }
}

export function htmlToMarkdown(html: string): string {
  const { document } = parseHTML(`<!DOCTYPE html><html><body>${html}</body></html>`);
  const body = document.body;
  let out = '';
  body.childNodes.forEach((c) => {
    out += convertNode(c);
  });
  out = out.replace(/\n{3,}/g, '\n\n');
  return out.trim();
}
