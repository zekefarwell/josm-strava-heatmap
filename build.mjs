import { build } from 'esbuild';
import esbuildCopy from 'esbuild-plugin-copy';
import archiver from 'archiver';
import webExtModule from 'web-ext';
import { createWriteStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const copy = esbuildCopy?.default ?? esbuildCopy;
const webExt = webExtModule?.default ?? webExtModule;

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(rootDir, 'dist');
const chromeOutDir = path.join(distDir, 'chrome');
const firefoxOutDir = path.join(distDir, 'firefox');
const artifactsDir = path.join(rootDir, 'artifacts');
const chromeManifestPath = path.join(rootDir, 'manifest.v3.json');
const firefoxManifestPath = path.join(rootDir, 'manifest.v2.json');
const isDev = process.argv.includes('--dev');

async function run() {
  console.log(`Building in ${isDev ? 'development' : 'production'} mode...`);
  await fs.rm(distDir, { recursive: true, force: true });

  await Promise.all([
    buildExtension({ outDir: chromeOutDir, manifestPath: chromeManifestPath }),
    buildExtension({ outDir: firefoxOutDir, manifestPath: firefoxManifestPath })
  ]);

  await packageArtifacts();
}

function buildExtension({ outDir, manifestPath }) {
  return build({
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
    sourcemap: isDev,
    plugins: [
      copy({
        resolveFrom: 'cwd',
        assets: [
          { from: [manifestPath], to: [path.join(outDir, 'manifest.json')] },
          { from: ['content.css'], to: [path.join(outDir, 'content.css')] },
          { from: ['icons/**/*'], to: [path.join(outDir, 'icons')] }
        ]
      })
    ]
  });
}

async function packageArtifacts() {
  try {
    await fs.mkdir(artifactsDir, { recursive: true });
    const [chromeZipPath, firefoxArtifacts] = await Promise.all([
      zipChrome(),
      buildFirefox()
    ]);
    console.log(`Chrome package created: ${chromeZipPath}`);
    if (firefoxArtifacts.length) {
      console.log(`Firefox package created: ${firefoxArtifacts.join(', ')}`);
    } else {
      console.log('Firefox package created: (no artifact paths reported)');
    }
  } catch (err) {
    console.error('Packaging failed:', err);
    throw err;
  }
}

async function zipChrome() {
  const outFile = path.join(artifactsDir, 'josm-strava-heatmap-chrome.zip');
  await fs.rm(outFile, { force: true });
  return new Promise((resolve, reject) => {
    const output = createWriteStream(outFile);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(chromeOutDir, false);
    archive.finalize();
  }).then(() => outFile);
}

async function buildFirefox() {
  const result = await webExt.cmd.build({
    sourceDir: firefoxOutDir,
    artifactsDir,
    overwriteDest: true
  }, { shouldExitProgram: false });
  if (Array.isArray(result?.artifacts) && result.artifacts.length) {
    return result.artifacts.map(a => a.path);
  }
  if (result?.extensionPath) {
    return [result.extensionPath];
  }
  return [];
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
