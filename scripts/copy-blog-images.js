import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const contentDir = path.join(projectRoot, 'src', 'content', 'blog');
const publicDir = path.join(projectRoot, 'public', 'images', 'blog');

// 画像ファイルの拡張子
const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif'];

console.log('Copying blog images...');
console.log(`From: ${contentDir}`);
console.log(`To: ${publicDir}`);

// public/images/blog ディレクトリをクリーンアップ（既存の画像を削除）
if (fs.existsSync(publicDir)) {
  fs.rmSync(publicDir, { recursive: true });
}
fs.mkdirSync(publicDir, { recursive: true });

// src/content/blog/**/* から画像を探す
const files = await glob('**/*.*', { cwd: contentDir });

let copiedCount = 0;

for (const file of files) {
  const ext = path.extname(file).toLowerCase();

  // 画像ファイルのみ処理（.mdは除外）
  if (!imageExts.includes(ext)) continue;

  const sourcePath = path.join(contentDir, file);
  const destPath = path.join(publicDir, file);

  // ディレクトリを作成
  fs.mkdirSync(path.dirname(destPath), { recursive: true });

  // コピー
  fs.copyFileSync(sourcePath, destPath);
  console.log(`✓ Copied: ${file}`);
  copiedCount++;
}

console.log(`\nTotal: ${copiedCount} image(s) copied.`);
