const { build } = require('esbuild');
const copy = require('esbuild-plugin-copy').default;
const archiver = require('archiver');
const webExt = require('web-ext').default;
const path = require('path');
const fs = require('fs/promises');

const rootDir = __dirname;
const outDir = path.join(rootDir, 'dist');
const artifactsDir = path.join(rootDir, 'artifacts');

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
      }),
      packageArtifacts()
    ]
  });
}

function packageArtifacts() {
  return {
    name: 'package-artifacts',
    setup(build) {
      build.onEnd(async (result) => {
        if (result.errors?.length) {
          return;
        }
        await fs.mkdir(artifactsDir, { recursive: true });
        await Promise.all([
          zipDist(),
          buildFirefox()
        ]);
      })
    }
  };
}

async function zipDist() {
  const outFile = path.join(artifactsDir, 'josm-strava-heatmap-chrome.zip');
  await fs.rm(outFile, { force: true });
  return new Promise((resolve, reject) => {
    const output = require('fs').createWriteStream(outFile);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(outDir, false);
    archive.finalize();
  });
}

async function buildFirefox() {
  const result = await webExt.cmd.build({
    sourceDir: outDir,
    artifactsDir,
    overwriteDest: true
  }, { shouldExitProgram: false });
  return result;
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
