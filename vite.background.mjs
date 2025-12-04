import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: path.resolve(__dirname, 'background.js'),
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'background.js'
      }
    }
  },
  plugins: [
    viteStaticCopy({
      targets: [
        { src: 'manifest.json', dest: '.' },
        { src: 'content.css', dest: '.' },
        { src: 'icons', dest: '.' }
      ]
    })
  ]
});
