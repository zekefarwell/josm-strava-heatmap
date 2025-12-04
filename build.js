const { build } = require('esbuild');
const copy = require('esbuild-plugin-copy').default;
const path = require('path');
const fs = require('fs/promises');

const rootDir = __dirname;
const outDir = path.join(rootDir, 'dist');

async function run() {
  await fs.rm(outDir, { recursive: true, force: true });

  await build({
    entryPoints: [
      path.join(rootDir, 'background.js'),
      path.join(rootDir, 'content.js')
    ],
    outdir: outDir,
    bundle: true,
    format: 'iife',
    entryNames: '[name]',
    splitting: false,
    target: 'es2020',
    sourcemap: false,
    plugins: [
      copy({
        resolveFrom: 'cwd',
        assets: [
          { from: ['manifest.json'], to: [path.join(outDir, 'manifest.json')] },
          { from: ['content.css'], to: [path.join(outDir, 'content.css')] },
          { from: ['icons/**/*'], to: [path.join(outDir, 'icons')] }
        ]
      })
    ]
  });
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
