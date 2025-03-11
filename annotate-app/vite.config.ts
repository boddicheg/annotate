import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { normalizePath } from 'vite'
import { fileURLToPath } from 'url';
import path from 'path';

import dns from 'dns'

dns.setDefaultResultOrder('verbatim')

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Add this line
      include: "**/*.jsx",
    }),
    viteStaticCopy({
      targets: [
        { src: 'dist/index.html', dest: '../../backend/templates' },
        { src: 'dist/*', dest: '../../backend/static' },
      ],
    }),
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: normalizePath(path.resolve(__dirname, 'index.html')),
      },
    },
  },
});
