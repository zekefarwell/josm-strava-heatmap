#!/usr/bin/env node
const { execFileSync } = require('child_process');
const path = require('path');
const webExt = require('web-ext').default;

const ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT, 'dist');
const ARTIFACTS_DIR = path.join(ROOT, 'artifacts');

function run(command, args) {
  execFileSync(command, args, { cwd: ROOT, stdio: 'inherit' });
}

async function main() {
  run('npm', ['run', 'build']);

  const result = await webExt.cmd.build({
    sourceDir: DIST_DIR,
    artifactsDir: ARTIFACTS_DIR,
    overwriteDest: true,
  }, { shouldExitProgram: false });

  const output = result?.artifacts?.map(a => a.path).join(', ');
  console.log(`Firefox package created: ${output || '(none reported)'}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
