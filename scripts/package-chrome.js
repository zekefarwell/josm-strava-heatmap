#!/usr/bin/env node
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT, 'dist');
const ARTIFACTS_DIR = path.join(ROOT, 'artifacts');

function run(command, args) {
  execFileSync(command, args, { cwd: ROOT, stdio: 'inherit' });
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function zipDirectory(srcDir, outFile) {
  ensureDir(path.dirname(outFile));
  await fs.promises.rm(outFile, { force: true });

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outFile);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', resolve);
    archive.on('error', reject);

    archive.pipe(output);
    archive.directory(srcDir, false);
    archive.finalize();
  });
}

async function main() {
  run('npm', ['run', 'build']);

  const outFile = path.join(ARTIFACTS_DIR, 'josm-strava-heatmap-chrome.zip');
  await zipDirectory(DIST_DIR, outFile);
  console.log(`Chrome package created: ${outFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
