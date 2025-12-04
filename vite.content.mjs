import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    sourcemap: false,
    rollupOptions: {
      input: path.resolve(__dirname, 'content.js'),
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'content.js'
      }
    }
  }
});
