import { Resvg } from '@resvg/resvg-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const svgPath = path.join(__dirname, '../public/favicon.svg');
const svg = fs.readFileSync(svgPath, 'utf8');

const sizes = [16, 32, 180, 192, 512];

sizes.forEach(size => {
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: size,
    },
  });

  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  let filename;
  if (size === 180) {
    filename = 'apple-touch-icon.png';
  } else if (size === 192 || size === 512) {
    filename = `icon-${size}x${size}.png`;
  } else {
    filename = `favicon-${size}x${size}.png`;
  }

  fs.writeFileSync(
    path.join(__dirname, `../public/${filename}`),
    pngBuffer
  );

  console.log(`✓ Generated ${filename}`);
});

console.log('✓ All favicons generated successfully!');
