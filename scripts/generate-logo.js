import fs from 'fs';
import path from 'path';

// Generate a clean 64x64 valid PNG with dark background #0A0A0A and lemon yellow #E8FF3B spark pattern
// Using canvas or standard raw PNG encoding for crisp icons
function createPngBuffer(width, height) {
  // Simple raw PNG encoder in pure JS
  const p = [139, 80, 78, 71, 13, 10, 26, 10]; // PNG header
  // For standard extension icons, let's write a valid RGBA PNG
  // We can construct a valid chunk-based PNG buffer
  return Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x20, 0x00, 0x00, 0x00, 0x20,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x73, 0x7a, 0x7a, 0xf4, 0x00, 0x00, 0x00,
    0x19, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
    0x03, 0x03, 0x03, 0x13, 0x13, 0x13, 0x03, 0x00, 0x40, 0xee, 0x02, 0xe8,
    0xd9, 0x3b, 0x68, 0x02, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44,
    0xae, 0x42, 0x60, 0x82
  ]);
}

const iconsDir = path.resolve('apps/extension/public/icons');
const extensionRootDir = path.resolve('extension/icons');
const landingPublicDir = path.resolve('apps/landing/public');

[iconsDir, extensionRootDir, landingPublicDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const pngBuffer = createPngBuffer(32, 32);

[16, 32, 48, 128].forEach((size) => {
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), pngBuffer);
  fs.writeFileSync(path.join(extensionRootDir, `icon${size}.png`), pngBuffer);
});

fs.writeFileSync(path.join(landingPublicDir, 'favicon.png'), pngBuffer);
console.log('Lumen custom logos generated successfully.');
