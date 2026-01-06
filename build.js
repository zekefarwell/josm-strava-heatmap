const { build } = require('esbuild');
const copy = require('esbuild-plugin-copy').default;
const archiver = require('archiver');
const webExt = require('web-ext').default;
const path = require('path');
const fs = require('fs/promises');

const rootDir = __dirname;
const outDir = path.join(rootDir, 'dist');
const artifactsDir = path.join(rootDir, 'artifacts');
const chromeManifestPath = path.join(rootDir, 'manifest.v3.json');
const firefoxManifestPath = path.join(rootDir, 'manifest.v2.json');
const isDev = process.argv.includes('--dev');

async function run() {
  console.log(`Building in ${isDev ? 'development' : 'production'} mode...`);
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
    sourcemap: isDev,
    plugins: [
      copy({
        resolveFrom: 'cwd',
        assets: [
          { from: [chromeManifestPath], to: [path.join(outDir, 'manifest.json')] },
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
        try {
          await fs.mkdir(artifactsDir, { recursive: true });
          const [chromeZipPath, firefoxArtifacts] = await Promise.all([
            zipDist(),
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
  }).then(() => outFile);
}

async function buildFirefox() {
  const manifestPath = path.join(outDir, 'manifest.json');
  const originalManifest = await fs.readFile(manifestPath);
  await fs.copyFile(firefoxManifestPath, manifestPath);
  try {
    const result = await webExt.cmd.build({
      sourceDir: outDir,
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
  } finally {
    await fs.writeFile(manifestPath, originalManifest);
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
