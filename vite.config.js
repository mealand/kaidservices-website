import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  server: { port: 5173, open: false },
  preview: { port: 4173 },
  build: {
    outDir: 'dist',
    target: 'es2020',
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 700, // three.js is lazy-loaded in its own chunk
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        notFound: resolve(import.meta.dirname, '404.html'),
      },
    },
  },
});
