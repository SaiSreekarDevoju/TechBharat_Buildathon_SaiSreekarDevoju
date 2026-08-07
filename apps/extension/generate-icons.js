import fs from 'fs';
import path from 'path';

// Valid 1x1 lemon yellow PNG base64 data:
const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const buffer = Buffer.from(base64Png, 'base64');

const iconsDir = path.resolve('public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

[16, 32, 48, 128].forEach((size) => {
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), buffer);
});
console.log('Icons generated successfully.');
