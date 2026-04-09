#!/usr/bin/env node
/**
 * scripts/test-ogp.js
 * OGP 画像のデザインテスト用（1枚だけ生成）
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Resvg } from '@resvg/resvg-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const FONT_BOLD = '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc';
const FONT_REGULAR = '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc';

// テスト用タイトル（実際の記事に近い長さ）
const TEST_TITLE = '24歳から見た「ChatGPTの世界」とは';

mkdirSync(join(ROOT, 'public/ogp'), { recursive: true });

const t0 = Date.now();
const svg = buildOgpSvg(TEST_TITLE);
const resvg = new Resvg(svg, {
  font: {
    fontFiles: [FONT_BOLD, FONT_REGULAR],
    loadSystemFonts: false,
  },
  fitTo: { mode: 'width', value: 1200 },
});
const png = resvg.render().asPng();
const elapsed = Date.now() - t0;

const outPath = join(ROOT, 'public/ogp/_test.png');
writeFileSync(outPath, png);
console.log(`生成完了: public/ogp/_test.png (${png.length} bytes, ${elapsed}ms)`);

// ── SVG 生成 ──────────────────────────────────────────────────────────────

function buildOgpSvg(title) {
  const W = 1200, H = 630;
  const PADDING_X = 80;
  const AVAILABLE_W = W - PADDING_X * 2;

  // タイトルの長さに応じてフォントサイズを調整
  const titleLen = [...title].length;
  const fontSize = titleLen <= 18 ? 80
                 : titleLen <= 28 ? 68
                 : 56;
  const lineHeight = fontSize * 1.35;

  const lines = wrapText(title, fontSize, AVAILABLE_W);

  // タイトルブロックの高さを求めて垂直中央に配置（下部バーより上）
  const textBlockH = lines.length * lineHeight;
  const areaTop = 100;   // ロゴの下
  const areaBottom = 570; // 下部バーの上
  const titleY = areaTop + (areaBottom - areaTop - textBlockH) / 2 + fontSize * 0.85;

  const titleSvg = lines.map((line, i) =>
    `<text x="${PADDING_X}" y="${titleY + i * lineHeight}"
      font-family="'Noto Sans CJK JP', 'Noto Sans JP', sans-serif"
      font-size="${fontSize}"
      font-weight="bold"
      fill="#111111"
      letter-spacing="-1"
    >${escXml(line)}</text>`
  ).join('\n  ');

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFD700"/>
      <stop offset="100%" stop-color="#FFC200"/>
    </linearGradient>
    <!-- チェッカーパターン（ブログヘッダーと同じ） -->
    <pattern id="checker" x="0" y="0" width="96" height="52" patternUnits="userSpaceOnUse">
      <rect x="0"  y="0"  width="3" height="8" fill="black"/>
      <rect x="6"  y="0"  width="3" height="8" fill="black"/>
      <rect x="12" y="0"  width="3" height="8" fill="black"/>
      <rect x="18" y="0"  width="3" height="8" fill="black"/>
      <rect x="24" y="0"  width="3" height="8" fill="black"/>
      <rect x="30" y="0"  width="3" height="8" fill="black"/>
      <rect x="0"  y="9"  width="96" height="2" fill="black"/>
      <path d="M4,13 H18 V20 H15 V27 H18 V34 H4 V27 H7 V20 H4 Z"   fill="black"/>
      <path d="M22,13 H36 V20 H33 V27 H36 V34 H22 V27 H25 V20 H22 Z" fill="black"/>
      <path d="M52,13 H66 V20 H63 V27 H66 V34 H52 V27 H55 V20 H52 Z" fill="black"/>
      <path d="M70,13 H84 V20 H81 V27 H84 V34 H70 V27 H73 V20 H70 Z" fill="black"/>
      <rect x="0"  y="35" width="96" height="2" fill="black"/>
      <rect x="0"  y="38" width="3" height="8" fill="black"/>
      <rect x="6"  y="38" width="3" height="8" fill="black"/>
      <rect x="12" y="38" width="3" height="8" fill="black"/>
      <rect x="18" y="38" width="3" height="8" fill="black"/>
      <rect x="24" y="38" width="3" height="8" fill="black"/>
      <rect x="30" y="38" width="3" height="8" fill="black"/>
    </pattern>
    <!--
      ミンサー柄フェード用マスク
      315deg = 右下→左上方向。対角線長≒1355px の35%=474px分だけ visible
      右下 (1200,630) → 474px 左上方向 → (865, 295) で opacity=0
    -->
    <linearGradient id="minsa-fade"
      x1="1200" y1="630" x2="865" y2="295"
      gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="white" stop-opacity="1"/>
      <stop offset="100%" stop-color="white" stop-opacity="0"/>
    </linearGradient>
    <mask id="minsa-mask">
      <rect width="${W}" height="${H}" fill="url(#minsa-fade)"/>
    </mask>
  </defs>

  <!-- 背景グラデーション -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- ミンサー柄オーバーレイ（右下→左上フェード、opacity 0.22） -->
  <rect width="${W}" height="${H}" fill="url(#checker)" opacity="0.22"
    mask="url(#minsa-mask)"/>

  <!-- タイトル -->
  ${titleSvg}

  <!-- 下部バー -->
  <rect x="0" y="570" width="${W}" height="60" fill="rgba(0,0,0,0.13)"/>

  <!-- r>_ ロゴ -->
  <text x="${PADDING_X}" y="612"
    font-family="'Courier New', monospace"
    font-size="30"
    font-weight="bold"
    fill="rgba(0,0,0,0.65)"
  >r&gt;_ reiblast1123</text>

  <!-- ドメイン -->
  <text x="${W - PADDING_X}" y="612"
    font-family="'Courier New', monospace"
    font-size="22"
    fill="rgba(0,0,0,0.45)"
    text-anchor="end"
  >reiblast1123.com</text>
</svg>`;
}

// ── テキスト折り返し ──────────────────────────────────────────────────────

function wrapText(text, fontSize, maxWidth) {
  const lines = [];
  let current = '';
  let currentWidth = 0;

  for (const char of text) {
    const w = charWidth(char, fontSize);
    if (currentWidth + w > maxWidth && current.length > 0) {
      lines.push(current);
      current = char;
      currentWidth = w;
    } else {
      current += char;
      currentWidth += w;
    }
  }
  if (current) lines.push(current);

  // 最大3行。4行目以降は3行目に結合（末尾に … 追加）
  if (lines.length > 3) {
    const rest = lines.slice(2).join('');
    const trimmed = truncate(rest, fontSize, maxWidth - charWidth('…', fontSize));
    return [...lines.slice(0, 2), trimmed + '…'];
  }
  return lines;
}

function charWidth(char, fontSize) {
  const code = char.codePointAt(0);
  // ASCII 以外（全角文字）は 1.0em、ASCII は 0.55em
  return code > 127 ? fontSize * 1.0 : fontSize * 0.55;
}

function truncate(text, fontSize, maxWidth) {
  let result = '';
  let w = 0;
  for (const char of text) {
    const cw = charWidth(char, fontSize);
    if (w + cw > maxWidth) break;
    result += char;
    w += cw;
  }
  return result;
}

function escXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
