import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

function copyExtensionAssets() {
  return {
    name: 'copy-extension-assets',
    closeBundle() {
      const targetDir = resolve(__dirname, '../../extension');
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Copy manifest.json
      fs.copyFileSync(
        resolve(__dirname, 'manifest.json'),
        resolve(targetDir, 'manifest.json')
      );

      // Copy icons folder
      const iconsSrc = resolve(__dirname, 'public/icons');
      const iconsDest = resolve(targetDir, 'icons');
      if (fs.existsSync(iconsSrc)) {
        if (!fs.existsSync(iconsDest)) {
          fs.mkdirSync(iconsDest, { recursive: true });
        }
        fs.readdirSync(iconsSrc).forEach((file) => {
          fs.copyFileSync(resolve(iconsSrc, file), resolve(iconsDest, file));
        });
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), copyExtensionAssets()],
  resolve: {
    alias: {
      '@lumen/shared': resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
  build: {
    outDir: resolve(__dirname, '../../extension'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/background/index.ts'),
        content: resolve(__dirname, 'src/content/index.ts'),
        sidepanel: resolve(__dirname, 'src/sidepanel/index.html'),
        options: resolve(__dirname, 'src/options/index.html'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background' || chunkInfo.name === 'content') {
            return 'src/[name]/index.js';
          }
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
});
