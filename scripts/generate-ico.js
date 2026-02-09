import toIco from 'to-ico';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '../public');

const files = [
  path.join(publicDir, 'favicon-16x16.png'),
  path.join(publicDir, 'favicon-32x32.png')
];

const buffers = files.map(file => fs.readFileSync(file));

toIco(buffers).then(buf => {
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), buf);
  console.log('✓ Generated favicon.ico');
}).catch(err => {
  console.error('Error generating favicon.ico:', err);
});
